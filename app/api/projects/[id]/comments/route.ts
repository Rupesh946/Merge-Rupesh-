import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

        const comments = await prisma.comment.findMany({
            where: { projectId },
            include: { author: { select: { id: true, name: true, username: true, image: true } } },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({ comments, page });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: projectId } = await params;
        const { content } = await req.json();
        if (!content) return NextResponse.json({ message: 'Content is required' }, { status: 400 });

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });

        const comment = await prisma.comment.create({
            data: { content, authorId: currentUser.id, projectId },
            include: { author: { select: { id: true, name: true, username: true, image: true } } },
        });

        if (project.authorId !== currentUser.id) {
            await prisma.notification.create({
                data: { type: 'comment', message: `${currentUser.name} commented on your project "${project.name}"`, targetId: projectId, userId: project.authorId },
            });
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
