const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { invalidateCacheByPattern } = require('../utils/redisUtils');
const { getIO, getUser } = require('../socket');

const router = express.Router();

// Get all projects
router.get('/', optionalAuth, cacheMiddleware(300), async (req, res) => { // Cache for 5 minutes
  try {
    const { page = 1, limit = 10, search, tag, featured, sort, following } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (featured === 'true') {
      where.featured = true;
    }

    // If user wants projects from users they follow
    if (req.user && following === 'true') {
      const userFollowing = await prisma.follow.findMany({
        where: { followerId: req.user.id },
        select: { followingId: true }
      });
      
      const followingIds = userFollowing.map(f => f.followingId);
      
      if (followingIds.length > 0) {
        where.authorId = { in: followingIds };
      } else {
        // If user follows no one, return empty result
        where.id = { equals: 'nonexistent' }; // This will result in no matches
      }
    }

    // Determine the sort order
    let orderBy = { createdAt: 'desc' }; // default
    
    if (sort === 'trending' || sort === 'popular') {
      // Sort by a combination of likes, comments, and recency
      // For now, we'll use a basic approach sorting by likes count and then creation date
      orderBy = [
        {
          _count: {
            likes: 'desc'
          }
        },
        { createdAt: 'desc' }
      ];
    } else if (sort === 'recent') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'stars') {
      orderBy = { stars: 'desc' };
    }

    const projects = await prisma.project.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    const total = await prisma.project.count({ where });

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', optionalAuth, cacheMiddleware(600), async (req, res) => { // Cache for 10 minutes
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if current user liked the project
    let isLiked = false;
    if (req.user) {
      const like = await prisma.like.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: project.id
          }
        }
      });
      isLiked = !!like;
    }

    res.json({ ...project, isLiked });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticateToken, [
  body('name').isLength({ min: 1 }).trim(),
  body('description').isLength({ min: 10 }).trim(),
  body('githubUrl').optional().isURL(),
  body('demoUrl').optional().isURL(),
  body('language').optional().isString(),
  body('tags').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, description, githubUrl, demoUrl, language, tags } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        githubUrl,
        demoUrl,
        language,
        tags,
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    });

    // Invalidate project cache after creation
    await invalidateCacheByPattern('cache:/api/projects*');

    const io = getIO();
    io.emit('new_project', project);

    res.status(201).json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, [
  body('name').optional().isLength({ min: 1 }).trim(),
  body('description').optional().isLength({ min: 10 }).trim(),
  body('githubUrl').optional().isURL(),
  body('demoUrl').optional().isURL(),
  body('language').optional().isString(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (existingProject.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    });

    // Invalidate project cache after update
    await invalidateCacheByPattern('cache:/api/projects*');
    await invalidateCacheByPattern(`cache:/api/projects/${req.params.id}*`);

    res.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Like/Unlike project
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const result = await prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const existingLike = await prisma.like.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      if (existingLike) {
        await prisma.like.delete({
          where: { id: existingLike.id }
        });
        return { liked: false, project };
      } else {
        try {
          const like = await prisma.like.create({
            data: {
              userId,
              projectId
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true
                }
              }
            }
          });
          return { liked: true, project, user: like.user };
        } catch (error) {
          if (error.code === 'P2002') {
            // Unique constraint violation, another request already created the like.
            // We can treat this as a success.
            const user = await prisma.user.findUnique({ where: { id: userId } });
            return { liked: true, project, user };
          }
          throw error;
        }
      }
    });

    await invalidateCacheByPattern('cache:/api/projects*');
    await invalidateCacheByPattern(`cache:/api/projects/${projectId}*`);

    if (result.liked) {
      const io = getIO();
      const ownerSocket = getUser(result.project.authorId);
      if (ownerSocket) {
        io.to(ownerSocket.socketId).emit('project_liked', { project: result.project, user: result.user });
      }
      res.json({ liked: true, message: 'Project liked' });
    } else {
      res.json({ liked: false, message: 'Project unliked' });
    }
  } catch (error) {
    console.error('Like project error:', error);
    if (error.message === 'Project not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to like/unlike project' });
  }
});

// Add comment to project
router.post('/:id/comments', authenticateToken, [
  body('content').isLength({ min: 1 }).trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { content } = req.body;
    const projectId = req.params.id;
    const userId = req.user.id;

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        projectId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Invalidate project cache after comment
    await invalidateCacheByPattern('cache:/api/projects*');
    await invalidateCacheByPattern(`cache:/api/projects/${projectId}*`);

    const io = getIO();
    io.emit('new_comment', comment);

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;