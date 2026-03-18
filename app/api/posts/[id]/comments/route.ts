import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/posts/[id]/comments
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
            },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({ comments, page });
    } catch (error) {
        console.error('Get comments error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/posts/[id]/comments
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: postId } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content?.trim()) {
            return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });
        }

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                authorId: currentUser.id,
                postId,
            },
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
            },
        });

        // Notify post author if someone else commented
        if (post.authorId !== currentUser.id) {
            await prisma.notification.create({
                data: {
                    type: 'comment',
                    message: `${currentUser.name} (@${currentUser.username}) commented on your post`,
                    targetId: postId,
                    userId: post.authorId,
                },
            });
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Add comment error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
