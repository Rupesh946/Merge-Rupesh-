import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

        // Get IDs of users the current user follows
        const following = await prisma.follow.findMany({
            where: { followerId: currentUser.id },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);

        // Include own posts too
        const authorIds = [currentUser.id, ...followingIds];

        const posts = await prisma.post.findMany({
            where: { authorId: { in: authorIds } },
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
                likes: { where: { userId: currentUser.id }, select: { id: true } },
                comments: {
                    include: { author: { select: { id: true, name: true, username: true, image: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const feedPosts = posts.map(({ likes, ...post }) => ({
            ...post,
            isLiked: (likes?.length ?? 0) > 0,
        }));

        return NextResponse.json({ posts: feedPosts, page });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Feed error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
