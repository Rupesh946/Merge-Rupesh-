import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/posts/[id]/report
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: postId } = await params;
        const body = await req.json().catch(() => ({}));
        const reason = body?.reason || 'Inappropriate content';

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

        if (post.authorId === currentUser.id) {
            return NextResponse.json({ message: 'Cannot report your own post' }, { status: 400 });
        }

        // Log as a notification to admin (targetId = postId, type = 'report')
        // In a full system you'd have a Report model; for now store as notification to post author's account
        // so admins can review — or simply log it server-side.
        console.log(
            `[REPORT] Post ${postId} reported by ${currentUser.username} (${currentUser.id}). Reason: ${reason}`
        );

        return NextResponse.json({ message: 'Report submitted. Thank you for keeping Merge safe.' });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
