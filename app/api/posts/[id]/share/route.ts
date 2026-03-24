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

        // Optional: In a full schema, you might create a "Share" record in the DB here.
        // For notifications, we immediately notify the author.
        if (post.authorId !== currentUser.id) {
            await prisma.notification.create({
                data: {
                    type: 'share',
                    message: `${currentUser.name} shared your post`,
                    targetId: postId,
                    userId: post.authorId,
                },
            });
        }

        return NextResponse.json({ message: 'Post shared successfully' });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
