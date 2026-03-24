import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getUserFromRequest(req);
        const { id } = await params;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
        if (notification.userId !== currentUser.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true },
        });

        return NextResponse.json({ notification: updated });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
