import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Aggregate tags from both posts and projects
        const posts = await prisma.post.findMany({ select: { tags: true } });
        const projects = await prisma.project.findMany({ select: { tags: true } });

        const tagCounts: Record<string, number> = {};
        for (const { tags } of [...posts, ...projects]) {
            for (const tag of tags) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }

        const trending = Object.entries(tagCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        return NextResponse.json({ tags: trending });
    } catch (error) {
        console.error('Tags error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
