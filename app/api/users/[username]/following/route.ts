import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page') || 1);
        const limit = 20;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const following = await prisma.follow.findMany({
            where: { followerId: user.id },
            include: {
                following: {
                    select: { id: true, name: true, username: true, image: true, bio: true, techStack: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({ following: following.map((f) => f.following), page });
    } catch (error) {
        console.error('Following error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
