import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: { some: { userId: currentUser.id } },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, username: true, image: true } },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { sender: { select: { id: true, name: true, username: true } } },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({ conversations });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { userId: targetUserId } = await req.json();

        if (!targetUserId) return NextResponse.json({ message: 'Target user ID required' }, { status: 400 });
        if (targetUserId === currentUser.id) return NextResponse.json({ message: 'Cannot message yourself' }, { status: 400 });

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        // Check if conversation already exists between these two users
        const existing = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: currentUser.id } } },
                    { participants: { some: { userId: targetUserId } } },
                ],
            },
            include: {
                participants: { include: { user: { select: { id: true, name: true, username: true, image: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });

        if (existing) return NextResponse.json({ conversation: existing });

        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [{ userId: currentUser.id }, { userId: targetUserId }],
                },
            },
            include: {
                participants: { include: { user: { select: { id: true, name: true, username: true, image: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });

        return NextResponse.json({ conversation }, { status: 201 });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        console.error('Create conversation error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
