import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RssItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    imageUrl: string | null;
    author: string;
    sourceName: string;
    sourceColor: string;
    sourceEmoji: string;
    publishedAt: string;
    tags: string[];
    category: 'ai' | 'coding' | 'design' | 'devops' | 'news';
}

// ── Sources ───────────────────────────────────────────────────────────────────
const SOURCES = [
    // ── AI & ML ──────────────────────────────────────────────────────────────
    {
        name: 'OpenAI Blog',
        url: 'https://openai.com/news/rss.xml',
        emoji: '🤖',
        color: '#10a37f',
        tags: ['ai', 'openai', 'gpt'],
        category: 'ai' as const,
    },
    {
        name: 'The Gradient',
        url: 'https://thegradient.pub/rss/',
        emoji: '🧠',
        color: '#7c3aed',
        tags: ['ai', 'ml', 'research'],
        category: 'ai' as const,
    },
    {
        name: 'MIT Tech Review',
        url: 'https://www.technologyreview.com/feed/',
        emoji: '🔬',
        color: '#c2185b',
        tags: ['ai', 'technology', 'research'],
        category: 'ai' as const,
    },
    {
        name: 'Towards Data Science',
        url: 'https://towardsdatascience.com/feed',
        emoji: '📊',
        color: '#1565c0',
        tags: ['ml', 'data-science', 'python'],
        category: 'ai' as const,
    },
    // ── Coding ───────────────────────────────────────────────────────────────
    {
        name: 'Dev.to',
        url: 'https://dev.to/feed',
        emoji: '👩‍💻',
        color: '#3b49df',
        tags: ['dev', 'webdev'],
        category: 'coding' as const,
    },
    {
        name: 'GitHub Blog',
        url: 'https://github.blog/feed/',
        emoji: '🐙',
        color: '#24292f',
        tags: ['github', 'open-source'],
        category: 'coding' as const,
    },
    {
        name: 'Node.js Blog',
        url: 'https://nodejs.org/en/feed/blog.xml',
        emoji: '🟢',
        color: '#5fa04e',
        tags: ['nodejs', 'backend'],
        category: 'coding' as const,
    },
    {
        name: 'Vercel Blog',
        url: 'https://vercel.com/atom',
        emoji: '▲',
        color: '#6366f1',
        tags: ['nextjs', 'deployment'],
        category: 'coding' as const,
    },
    {
        name: 'Hacker News',
        url: 'https://hnrss.org/frontpage',
        emoji: '🟠',
        color: '#ff6600',
        tags: ['tech', 'startup', 'coding'],
        category: 'coding' as const,
    },
    {
        name: 'LogRocket Blog',
        url: 'https://blog.logrocket.com/feed/',
        emoji: '🚀',
        color: '#764abc',
        tags: ['frontend', 'react', 'typescript'],
        category: 'coding' as const,
    },
    // ── Design ───────────────────────────────────────────────────────────────
    {
        name: 'CSS-Tricks',
        url: 'https://css-tricks.com/feed/',
        emoji: '🎨',
        color: '#ff2d55',
        tags: ['css', 'frontend'],
        category: 'design' as const,
    },
    {
        name: 'Smashing Mag',
        url: 'https://www.smashingmagazine.com/feed/',
        emoji: '📐',
        color: '#e9320b',
        tags: ['design', 'ux'],
        category: 'design' as const,
    },
    // ── Tech News ─────────────────────────────────────────────────────────────
    {
        name: 'Ars Technica',
        url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        emoji: '📡',
        color: '#e8742b',
        tags: ['tech', 'science', 'news'],
        category: 'news' as const,
    },
    {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        emoji: '⚡',
        color: '#ff3b30',
        tags: ['tech', 'gadgets', 'news'],
        category: 'news' as const,
    },
];

// ── Module-level cache ────────────────────────────────────────────────────────
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let cachedItems: RssItem[] = [];
let cacheTimestamp = 0;

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
        ],
    },
    timeout: 8000,
});

function extractImage(item: any): string | null {
    if (item.mediaContent?.['$']?.url) return item.mediaContent['$'].url;
    if (item.mediaThumbnail?.['$']?.url) return item.mediaThumbnail['$'].url;
    if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) return item.enclosure.url;
    const content = item['content:encoded'] || item.content || '';
    const match = content.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    return match ? match[1] : null;
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 240);
}

async function fetchSource(source: typeof SOURCES[0]): Promise<RssItem[]> {
    try {
        const feed = await parser.parseURL(source.url);
        return (feed.items || []).slice(0, 10).map((item: any) => ({
            id: `rss-${source.name}-${item.guid || item.link || Math.random()}`,
            title: item.title?.trim() || 'Untitled',
            summary: stripHtml(item['content:encoded'] || item.content || item.contentSnippet || ''),
            url: item.link || item.guid || '#',
            imageUrl: extractImage(item),
            author: item.creator || item.author || source.name,
            sourceName: source.name,
            sourceColor: source.color,
            sourceEmoji: source.emoji,
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            tags: source.tags,
            category: source.category,
        }));
    } catch {
        return [];
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 20), 50);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const source = searchParams.get('source') || 'all';
    const category = searchParams.get('category') || 'all';
    const bust = searchParams.get('bust');

    // Refresh cache if stale or forced
    if (bust || cachedItems.length === 0 || Date.now() - cacheTimestamp >= CACHE_TTL) {
        const results = await Promise.allSettled(SOURCES.map(fetchSource));
        const allItems = results
            .filter((r): r is PromiseFulfilledResult<RssItem[]> => r.status === 'fulfilled')
            .flatMap((r) => r.value);
        allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        cachedItems = allItems;
        cacheTimestamp = Date.now();
    }

    // Filter
    let items = cachedItems;
    if (source !== 'all') items = items.filter((i) => i.sourceName === source);
    if (category !== 'all') items = items.filter((i) => i.category === category);

    // Paginate
    const total = items.length;
    const offset = (page - 1) * limit;
    const paged = items.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return NextResponse.json({
        items: paged,
        page,
        limit,
        total,
        hasMore,
        sources: SOURCES.map((s) => ({ name: s.name, emoji: s.emoji, color: s.color, category: s.category })),
    });
}
