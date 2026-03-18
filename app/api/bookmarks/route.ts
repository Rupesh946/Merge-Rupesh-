import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const db = prisma as any;

// GET /api/bookmarks  — get all posts bookmarked by the current user
export async function GET(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

        const bookmarks = await db.bookmark.findMany({
            where: { userId: currentUser.id },
            include: {
                post: {
                    select: {
                        id: true,
                        content: true,
                        codeSnippet: true,
                        codeLanguage: true,
                        imageUrl: true,
                        tags: true,
                        createdAt: true,
                        updatedAt: true,
                        author: { select: { id: true, name: true, username: true, image: true } },
                        _count: { select: { likes: true, comments: true } },
                        likes: { where: { userId: currentUser.id }, select: { id: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const posts = bookmarks.map(({ post }: { post: any }) => ({
            ...post,
            isLiked: (post.likes?.length ?? 0) > 0,
            isBookmarked: true,
            likes: undefined,
        }));

        return NextResponse.json({ posts, page });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
