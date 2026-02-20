import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const user = await getUserFromRequest(req);
        const { password: _, ...userWithoutPassword } = user;

        const counts = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                _count: { select: { followers: true, following: true, posts: true, projects: true } },
            },
        });

        return NextResponse.json({ user: { ...userWithoutPassword, ...counts } });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const currentUser = await getUserFromRequest(req);
        const body = await req.json();

        const allowedFields = ['name', 'bio', 'location', 'website', 'githubUsername', 'image', 'techStack'];
        const updateData: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updateData[field] = body[field];
        }

        const updated = await prisma.user.update({
            where: { id: currentUser.id },
            data: updateData,
        });

        const { password: _, ...userWithoutPassword } = updated;
        return NextResponse.json({ user: userWithoutPassword });
    } catch (error: any) {
        if (error?.message === 'No token provided' || error?.message === 'User not found') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Profile update error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
