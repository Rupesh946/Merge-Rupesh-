import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        let currentUserId: string | null = null;
        const token = getTokenFromRequest(req);
        if (token) {
            try { const p = await verifyToken(token); currentUserId = p.id as string; } catch { }
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { likes: true, comments: true } },
                likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
                comments: {
                    include: { author: { select: { id: true, name: true, username: true, image: true } } },
                    orderBy: { createdAt: 'asc' },
                    take: 20,
                },
            },
        });

        if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        const { likes, ...data } = project as any;
        return NextResponse.json({ project: { ...data, isLiked: currentUserId ? (likes?.length ?? 0) > 0 : false } });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id } = await params;
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        if (project.authorId !== currentUser.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const allowedFields = ['name', 'description', 'githubUrl', 'demoUrl', 'language', 'tags', 'imageUrl', 'featured'];
        const updateData: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updateData[field] = body[field];
        }

        const updated = await prisma.project.update({
            where: { id },
            data: updateData,
            include: { author: { select: { id: true, name: true, username: true, image: true } }, _count: { select: { likes: true, comments: true } } },
        });

        return NextResponse.json({ project: updated });
    } catch (error: any) {
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
        const { id } = await params;
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        if (project.authorId !== currentUser.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        await prisma.project.delete({ where: { id } });
        return NextResponse.json({ message: 'Project deleted' });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
