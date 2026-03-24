import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const page = Number(searchParams.get('page') || 1);
        const limit = Math.min(Number(searchParams.get('limit') || 30), 50);

        const notifications = await prisma.notification.findMany({
            where: {
                userId: currentUser.id,
                ...(unreadOnly ? { read: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: currentUser.id, read: false, type: { not: 'message' } },
        });

        const unreadMessagesCount = await prisma.notification.count({
            where: { userId: currentUser.id, read: false, type: 'message' },
        });

        return NextResponse.json({ notifications, unreadCount, unreadMessagesCount, page });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        await prisma.notification.updateMany({
            where: { userId: currentUser.id, read: false },
            data: { read: true },
        });
        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
