import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/feed/following — compact recent posts from followed users only
export async function GET(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { searchParams } = new URL(req.url);
        const limit = Math.min(Number(searchParams.get('limit') || 15), 30);

        // Get who the current user follows
        const following = await prisma.follow.findMany({
            where: { followerId: currentUser.id },
            select: { followingId: true },
        });

        if (following.length === 0) {
            return NextResponse.json({ posts: [] });
        }

        const followingIds = following.map((f) => f.followingId);

        const posts = await prisma.post.findMany({
            where: { authorId: { in: followingIds } },
            select: {
                id: true,
                content: true,
                imageUrl: true,
                tags: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                _count: { select: { likes: true, comments: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ posts });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Following feed error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
