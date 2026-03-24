import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        let currentUserId: string | null = null;
        const token = getTokenFromRequest(req);
        if (token) {
            try {
                const payload = await verifyToken(token);
                currentUserId = payload.id as string;
            } catch { }
        }

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { likes: true, comments: true } },
                likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
                comments: {
                    include: { author: { select: { id: true, name: true, username: true, image: true } } },
                    orderBy: { createdAt: 'asc' },
                    take: 20,
                },
            },
        });

        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

        const { likes, ...postData } = post as any;
        return NextResponse.json({ post: { ...postData, isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false } });
    } catch (error) {
        console.error('Get post error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id } = await params;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        if (post.authorId !== currentUser.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const updated = await prisma.post.update({
            where: { id },
            data: {
                ...(body.content && { content: body.content }),
                ...(body.codeSnippet !== undefined && { codeSnippet: body.codeSnippet }),
                ...(body.codeLanguage !== undefined && { codeLanguage: body.codeLanguage }),
                ...(body.tags && { tags: body.tags }),
            },
            include: { author: { select: { id: true, name: true, username: true, image: true } }, _count: { select: { likes: true, comments: true } } },
        });

        return NextResponse.json({ post: updated });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id } = await params;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        if (post.authorId !== currentUser.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        await prisma.post.delete({ where: { id } });
        return NextResponse.json({ message: 'Post deleted' });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
