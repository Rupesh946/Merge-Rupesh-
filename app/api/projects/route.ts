import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, getTokenFromRequest, verifyToken } from '@/lib/auth';

const PROJECT_SELECT = {
    id: true,
    name: true,
    description: true,
    githubUrl: true,
    demoUrl: true,
    language: true,
    stars: true,
    forks: true,
    tags: true,
    featured: true,
    imageUrl: true,
    createdAt: true,
    updatedAt: true,
    author: { select: { id: true, name: true, username: true, image: true } },
    _count: { select: { likes: true, comments: true } },
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);
        const search = searchParams.get('search') || '';
        const language = searchParams.get('language');
        const tag = searchParams.get('tag');
        const featured = searchParams.get('featured') === 'true';
        const authorUsername = searchParams.get('author');

        let currentUserId: string | null = null;
        const token = getTokenFromRequest(req);
        if (token) {
            try {
                const payload = await verifyToken(token);
                currentUserId = payload.id as string;
            } catch { }
        }

        const projects = await prisma.project.findMany({
            where: {
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                } : {}),
                ...(language ? { language } : {}),
                ...(tag ? { tags: { has: tag } } : {}),
                ...(featured ? { featured: true } : {}),
                ...(authorUsername ? { author: { username: authorUsername } } : {}),
            },
            select: {
                ...PROJECT_SELECT,
                ...(currentUserId
                    ? { likes: { where: { userId: currentUserId }, select: { id: true } } }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const projectsWithLiked = projects.map(({ likes, ...p }: any) => ({
            ...p,
            isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false,
        }));

        return NextResponse.json({ projects: projectsWithLiked, page });
    } catch (error) {
        console.error('Projects list error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const body = await req.json();

        if (!body.name || !body.description) {
            return NextResponse.json({ message: 'Name and description are required' }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                name: body.name,
                description: body.description,
                githubUrl: body.githubUrl || null,
                demoUrl: body.demoUrl || null,
                language: body.language || null,
                tags: body.tags || [],
                imageUrl: body.imageUrl || null,
                stars: body.stars || 0,
                forks: body.forks || 0,
                authorId: currentUser.id,
            },
            select: PROJECT_SELECT,
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Create project error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
