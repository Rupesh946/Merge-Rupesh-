import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: projectId } = await params;
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return NextResponse.json({ message: 'Project not found' }, { status: 404 });

        await prisma.like.create({ data: { userId: currentUser.id, projectId } });

        if (project.authorId !== currentUser.id) {
            await prisma.notification.create({
                data: { type: 'like', message: `${currentUser.name} liked your project "${project.name}"`, targetId: projectId, userId: project.authorId },
            });
        }

        const count = await prisma.like.count({ where: { projectId } });
        return NextResponse.json({ liked: true, count });
    } catch (error: any) {
        if (error?.code === 'P2002') return NextResponse.json({ message: 'Already liked' }, { status: 409 });
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
        const { id: projectId } = await params;
        await prisma.like.deleteMany({ where: { userId: currentUser.id, projectId } });
        const count = await prisma.like.count({ where: { projectId } });
        return NextResponse.json({ liked: false, count });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
