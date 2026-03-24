import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

        // Optional: get current user to hide self from results
        let currentUserId: string | null = null;
        const token = getTokenFromRequest(req);
        if (token) {
            try {
                const payload = await verifyToken(token);
                currentUserId = payload.id as string;
            } catch { }
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    currentUserId ? { NOT: { id: currentUserId } } : {},
                    search
                        ? {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' } },
                                { username: { contains: search, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                ],
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                bio: true,
                techStack: true,
                githubUsername: true,
                createdAt: true,
                _count: { select: { followers: true, following: true, posts: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Users list error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
