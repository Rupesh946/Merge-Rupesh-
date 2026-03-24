import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/users/suggested
// Returns users the current user doesn't follow yet, ordered by follower count.
export async function GET(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { searchParams } = new URL(req.url);
        const limit = Math.min(Number(searchParams.get('limit') || 10), 30);

        // Get IDs already followed
        const following = await prisma.follow.findMany({
            where: { followerId: currentUser.id },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);

        // Exclude self and already-followed
        const excludeIds = [currentUser.id, ...followingIds];

        const users = await prisma.user.findMany({
            where: { id: { notIn: excludeIds } },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                bio: true,
                _count: { select: { followers: true, posts: true } },
            },
            orderBy: { followers: { _count: 'desc' } },
            take: limit,
        });

        const usersWithFollowing = users.map((u) => ({
            ...u,
            isFollowing: false,
        }));

        return NextResponse.json({ users: usersWithFollowing });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
