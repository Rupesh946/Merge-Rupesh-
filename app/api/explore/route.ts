import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'all'; // 'posts' | 'projects' | 'all'
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

        let currentUserId: string | null = null;
        const token = getTokenFromRequest(req);
        if (token) {
            try { const p = await verifyToken(token); currentUserId = p.id as string; } catch { }
        }

        const result: { posts?: any[]; projects?: any[] } = {};

        if (type === 'all' || type === 'posts') {
            const posts = await prisma.post.findMany({
                select: {
                    id: true,
                    content: true,
                    codeSnippet: true,
                    codeLanguage: true,
                    imageUrl: true,
                    tags: true,
                    createdAt: true,
                    author: { select: { id: true, name: true, username: true, image: true } },
                    _count: { select: { likes: true, comments: true } },
                    ...(currentUserId ? { likes: { where: { userId: currentUserId }, select: { id: true } } } : {}),
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            });
            result.posts = posts.map(({ likes, ...p }: any) => ({
                ...p,
                isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false,
            }));
        }

        if (type === 'all' || type === 'projects') {
            const projects = await prisma.project.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    language: true,
                    githubUrl: true,
                    demoUrl: true,
                    tags: true,
                    stars: true,
                    forks: true,
                    featured: true,
                    createdAt: true,
                    author: { select: { id: true, name: true, username: true, image: true } },
                    _count: { select: { likes: true, comments: true } },
                    ...(currentUserId ? { likes: { where: { userId: currentUserId }, select: { id: true } } } : {}),
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            });
            result.projects = projects.map(({ likes, ...p }: any) => ({
                ...p,
                isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false,
            }));
        }

        return NextResponse.json({ ...result, page });
    } catch (error) {
        console.error('Explore error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
