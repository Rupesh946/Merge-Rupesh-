import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const db = prisma as any;

// POST /api/posts/[id]/bookmark  — save a post
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: postId } = await params;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

        await db.bookmark.create({
            data: { userId: currentUser.id, postId },
        });

        return NextResponse.json({ bookmarked: true });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ message: 'Already bookmarked' }, { status: 409 });
        }
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/posts/[id]/bookmark  — unsave a post
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: postId } = await params;

        await db.bookmark.deleteMany({
            where: { userId: currentUser.id, postId },
        });

        return NextResponse.json({ bookmarked: false });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
