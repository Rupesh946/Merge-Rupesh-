import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { username } = await params;

        const targetUser = await prisma.user.findUnique({ where: { username } });
        if (!targetUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });
        if (targetUser.id === currentUser.id)
            return NextResponse.json({ message: 'Cannot follow yourself' }, { status: 400 });

        await prisma.follow.create({
            data: { followerId: currentUser.id, followingId: targetUser.id },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                type: 'follow',
                message: `${currentUser.name} (@${currentUser.username}) started following you`,
                userId: targetUser.id,
            },
        });

        return NextResponse.json({ message: 'Followed successfully' });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ message: 'Already following this user' }, { status: 409 });
        }
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Follow error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { username } = await params;

        const targetUser = await prisma.user.findUnique({ where: { username } });
        if (!targetUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        await prisma.follow.delete({
            where: {
                followerId_followingId: { followerId: currentUser.id, followingId: targetUser.id },
            },
        });

        return NextResponse.json({ message: 'Unfollowed successfully' });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Unfollow error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
