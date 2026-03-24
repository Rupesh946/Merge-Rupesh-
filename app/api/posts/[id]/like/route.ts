import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: postId } = await params;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

        await prisma.like.create({ data: { userId: currentUser.id, postId } });

        // Notify post author (if not liking own post)
        if (post.authorId !== currentUser.id) {
            await prisma.notification.create({
                data: {
                    type: 'like',
                    message: `${currentUser.name} liked your post`,
                    targetId: postId,
                    userId: post.authorId,
                },
            });
        }

        const count = await prisma.like.count({ where: { postId } });
        return NextResponse.json({ liked: true, count });
    } catch (error: any) {
        if (error?.code === 'P2002') return NextResponse.json({ message: 'Already liked' }, { status: 409 });
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
        const { id: postId } = await params;

        await prisma.like.deleteMany({ where: { userId: currentUser.id, postId } });

        const count = await prisma.like.count({ where: { postId } });
        return NextResponse.json({ liked: false, count });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
