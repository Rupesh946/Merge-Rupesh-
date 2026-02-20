import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        // Optional auth to check follow status
        let currentUserId: string | null = null;
        const token = getTokenFromRequest(req);
        if (token) {
            try {
                const payload = await verifyToken(token);
                currentUserId = payload.id as string;
            } catch { }
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                bio: true,
                location: true,
                website: true,
                githubUsername: true,
                techStack: true,
                createdAt: true,
                _count: {
                    select: { followers: true, following: true, posts: true, projects: true },
                },
                posts: {
                    orderBy: { createdAt: 'desc' },
                    take: 12,
                    select: {
                        id: true,
                        content: true,
                        codeSnippet: true,
                        codeLanguage: true,
                        imageUrl: true,
                        tags: true,
                        createdAt: true,
                        _count: { select: { likes: true, comments: true } },
                    },
                },
                projects: {
                    orderBy: { createdAt: 'desc' },
                    take: 6,
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        language: true,
                        githubUrl: true,
                        demoUrl: true,
                        tags: true,
                        stars: true,
                        forks: true,
                        createdAt: true,
                        _count: { select: { likes: true, comments: true } },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check if current user follows this user
        let isFollowing = false;
        if (currentUserId && currentUserId !== user.id) {
            const follow = await prisma.follow.findUnique({
                where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
            });
            isFollowing = !!follow;
        }

        return NextResponse.json({ user: { ...user, isFollowing } });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
