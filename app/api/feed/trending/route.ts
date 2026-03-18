import { NextResponse } from 'next/server';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Module-level in-memory cache ──────────────────────────────────────────────
let cachedStories: HNPost[] = [];
let cacheTimestamp = 0;

export interface HNPost {
    id: string;
    hnId: number;
    title: string;
    url: string | null;
    content: string;
    score: number;
    commentCount: number;
    author: string;
    createdAt: string;
    domain: string | null;
    source: 'hackernews';
}

async function fetchStory(id: number): Promise<HNPost | null> {
    try {
        const res = await fetch(`${HN_BASE}/item/${id}.json`, {
            next: { revalidate: 300 }, // Next.js fetch cache 5min
        });
        if (!res.ok) return null;
        const item = await res.json();

        if (!item || item.dead || item.deleted || item.type !== 'story' || !item.title) return null;

        const domain = item.url
            ? (() => { try { return new URL(item.url).hostname.replace('www.', ''); } catch { return null; } })()
            : null;

        return {
            id: `hn-${item.id}`,
            hnId: item.id,
            title: item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
            content: item.text || item.title,
            score: item.score || 0,
            commentCount: item.descendants || 0,
            author: item.by || 'unknown',
            createdAt: new Date((item.time || Date.now() / 1000) * 1000).toISOString(),
            domain,
            source: 'hackernews',
        };
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 20), 30);
    const type = (searchParams.get('type') || 'top') as 'top' | 'new' | 'best';

    // Return cached result if still fresh
    if (cachedStories.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
        return NextResponse.json({ stories: cachedStories.slice(0, limit), cached: true });
    }

    try {
        const endpoint = type === 'new' ? 'newstories' : type === 'best' ? 'beststories' : 'topstories';
        const idsRes = await fetch(`${HN_BASE}/${endpoint}.json`, {
            next: { revalidate: 300 },
        });

        if (!idsRes.ok) {
            return NextResponse.json({ message: 'Failed to fetch HN stories' }, { status: 502 });
        }

        const allIds: number[] = await idsRes.json();
        const topIds = allIds.slice(0, 40); // fetch more than needed to account for nulls

        const stories = await Promise.all(topIds.map(fetchStory));
        const filtered = stories.filter(Boolean) as HNPost[];

        // Cache the result
        cachedStories = filtered;
        cacheTimestamp = Date.now();

        return NextResponse.json({ stories: filtered.slice(0, limit), cached: false });
    } catch (error) {
        console.error('HN trending error:', error);
        // Return stale cache if available
        if (cachedStories.length > 0) {
            return NextResponse.json({ stories: cachedStories.slice(0, limit), cached: true, stale: true });
        }
        return NextResponse.json({ message: 'Failed to fetch trending stories' }, { status: 500 });
    }
}
