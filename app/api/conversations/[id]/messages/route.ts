import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: conversationId } = await params;
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 30), 50);

        // Verify user is a participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: { userId_conversationId: { userId: currentUser.id, conversationId } },
        });
        if (!participant) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: { sender: { select: { id: true, name: true, username: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Return in chronological order
        return NextResponse.json({ messages: messages.reverse(), page });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id: conversationId } = await params;
        const { content, codeSnippet, codeLanguage } = await req.json();

        if (!content) return NextResponse.json({ message: 'Message content is required' }, { status: 400 });

        // Verify user is a participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: { userId_conversationId: { userId: currentUser.id, conversationId } },
        });
        if (!participant) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        const message = await prisma.message.create({
            data: {
                content,
                codeSnippet: codeSnippet || null,
                codeLanguage: codeLanguage || null,
                senderId: currentUser.id,
                conversationId,
            },
            include: { sender: { select: { id: true, name: true, username: true, image: true } } },
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({ message }, { status: 201 });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        console.error('Send message error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
