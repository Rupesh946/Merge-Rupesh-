'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api, Project, Comment } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  MessageCircle,
  ExternalLink,
  Github,
  Star,
  MessageSquare,
  Send
} from 'lucide-react';

const ProjectDetailPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const projectId = pathname.split('/').pop();
  const { user } = useAuth();
  const userId = user?.id;

  const { isConnected, on, off } = useWebSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const commentInputRef = useRef<HTMLInputElement>(null);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const data = await api.getProject(projectId);
        setProject(data.project);
        setComments(data.project.comments || []);
      } catch (err) {
        setError('Failed to load project');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Handle like toggle with optimistic updates
  const handleLikeToggle = async () => {
    if (!project || !userId || isLiking) return;

    setIsLiking(true);

    // Optimistic update
    setProject(prev => {
      if (!prev) return null;
      const newIsLiked = !prev.isLiked;
      const newLikes = newIsLiked ? prev._count.likes + 1 : prev._count.likes - 1;
      return {
        ...prev,
        isLiked: newIsLiked,
        _count: {
          ...prev._count,
          likes: newLikes,
        },
      };
    });

    try {
      await api.likeProject(project.id);
    } catch (error) {
      // Revert on error
      setProject(prev => {
        if (!prev) return null;
        const newIsLiked = !prev.isLiked;
        const newLikes = newIsLiked ? prev._count.likes + 1 : prev._count.likes - 1;
        return {
          ...prev,
          isLiked: newIsLiked,
          _count: {
            ...prev._count,
            likes: newLikes,
          },
        };
      });
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle comment submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim() || !project || !userId) return;

    try {
      // Optimistically add comment to UI
      const optimisticComment: Comment = {
        id: `temp_${Date.now()}`,
        content: commentContent,
        createdAt: new Date().toISOString(),
        author: {
          id: userId,
          name: user?.name || '',
          username: user?.username || '',
          image: user?.image
        }
      };

      setComments(prev => [optimisticComment, ...prev]);
      setCommentContent('');

      // Add comment via API
      await api.addProjectComment(project.id, commentContent);

      // Focus back on input
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // Remove optimistic comment if API fails
      setComments(prev => prev.filter(c => !c.id.startsWith('temp_')));
    }
  };

  // Update project stats when receiving real-time notifications
  useEffect(() => {
    const handleProjectLiked = (data: { project: Project, user: any }) => {
      if (project && data.project.id === project.id) {
        setProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            _count: {
              ...prev._count,
              likes: data.project._count.likes,
            },
          };
        });
      }
    };

    const handleNewComment = (comment: Comment) => {
      if (project && (comment as any).projectId === project.id) {
        setComments(prev => [comment, ...prev.filter(c => !c.id.startsWith('temp_'))]);
      }
    };

    on('project_liked', handleProjectLiked);
    on('new_comment', handleNewComment);

    return () => {
      off('project_liked', handleProjectLiked);
      off('new_comment', handleNewComment);
    };
  }, [project, on, off, userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-light">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-light text-red-500">{error || 'Project not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-2">{project.name}</h1>
          <p className="text-lg text-muted-foreground mb-4">{project.description}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>by {project.author.name}</span>
            {project.language && <span>• {project.language}</span>}
            <span>• {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary/10 text-primary/80 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            className={`font-light ${project.isLiked ? 'text-red-500 border-red-500' : ''}`}
            onClick={handleLikeToggle}
            disabled={!userId || isLiking}
          >
            <Heart
              className={`mr-2 h-4 w-4 ${project.isLiked ? 'fill-current text-red-500' : ''}`}
            />
            {project._count.likes} {project._count.likes === 1 ? 'Like' : 'Likes'}
          </Button>

          <Button variant="outline" size="sm" className="font-light">
            <MessageCircle className="mr-2 h-4 w-4" />
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </Button>

          {project.githubUrl && (
            <Button variant="outline" size="sm" className="font-light" asChild>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
          )}

          {project.demoUrl && (
            <Button variant="outline" size="sm" className="font-light" asChild>
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Demo
              </a>
            </Button>
          )}
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-light">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Comment Form */}
              {userId && (
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex gap-2">
                    <Input
                      ref={commentInputRef}
                      placeholder="Add a comment..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={!commentContent.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="border-b border-border/20 pb-4 last:border-0">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.image || ''} />
                          <AvatarFallback>
                            {comment.author.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.author.name}</span>
                            <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        <div className="fixed bottom-4 right-4">
          <div className={`px-3 py-2 rounded-full text-xs font-medium ${isConnected
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
            }`}>
            {isConnected ? '⚡ Connected' : '⚠️ Disconnected'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
