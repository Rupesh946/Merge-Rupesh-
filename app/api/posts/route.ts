import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, getTokenFromRequest, verifyToken } from '@/lib/auth';

const POST_SELECT = {
    id: true,
    content: true,
    codeSnippet: true,
    codeLanguage: true,
    imageUrl: true,
    tags: true,
    createdAt: true,
    updatedAt: true,
    author: {
        select: { id: true, name: true, username: true, image: true },
    },
    _count: { select: { likes: true, comments: true } },
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);
        const tag = searchParams.get('tag');
        const authorId = searchParams.get('authorId');

        // Optional auth to add isLiked field
        let currentUserId: string | null = null;
        const token = getTokenFromRequest(req);
        if (token) {
            try {
                const payload = await verifyToken(token);
                currentUserId = payload.id as string;
            } catch { }
        }

        const posts = await prisma.post.findMany({
            where: {
                ...(tag ? { tags: { has: tag } } : {}),
                ...(authorId ? { authorId } : {}),
            },
            select: {
                ...POST_SELECT,
                ...(currentUserId
                    ? { likes: { where: { userId: currentUserId }, select: { id: true } } }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const postsWithLiked = posts.map(({ likes, ...post }: any) => ({
            ...post,
            isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false,
        }));

        return NextResponse.json({ posts: postsWithLiked, page });
    } catch (error) {
        console.error('Posts list error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const body = await req.json();

        if (!body.content) {
            return NextResponse.json({ message: 'Content is required' }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                content: body.content,
                codeSnippet: body.codeSnippet || null,
                codeLanguage: body.codeLanguage || null,
                imageUrl: body.imageUrl || null,
                tags: body.tags || [],
                authorId: currentUser.id,
            },
            select: POST_SELECT,
        });

        return NextResponse.json({ post }, { status: 201 });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Create post error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
