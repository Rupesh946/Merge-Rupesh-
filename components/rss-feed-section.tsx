"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Rss, RefreshCw, Globe, Sparkles, Zap,
    Heart, MessageCircle, Share2, Bookmark,
    BookOpen, ExternalLink, ArrowLeft, X, Clock,
    TrendingUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RssItem {
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
}

// ── Source tabs ───────────────────────────────────────────────────────────────
const SOURCES = [
    { label: "All", key: "all", icon: <Sparkles className="h-3 w-3" /> },
    { label: "Dev.to", key: "Dev.to", icon: <span className="text-[10px]">👩‍💻</span> },
    { label: "GitHub", key: "GitHub Blog", icon: <span className="text-[10px]">🐙</span> },
    { label: "CSS", key: "CSS-Tricks", icon: <span className="text-[10px]">🎨</span> },
    { label: "Smashing", key: "Smashing Mag", icon: <span className="text-[10px]">📐</span> },
    { label: "Node.js", key: "Node.js Blog", icon: <span className="text-[10px]">🟢</span> },
    { label: "Vercel", key: "Vercel Blog", icon: <span className="text-[10px]">▲</span> },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function trimSummary(text: string, max = 140) {
    if (!text) return "";
    const clean = text.replace(/<[^>]+>/g, "").trim();
    return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

// ── Main section ──────────────────────────────────────────────────────────────
export function RssFeedSection() {
    const [items, setItems] = useState<RssItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeSource, setActiveSource] = useState("all");
    const [refreshing, setRefreshing] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<RssItem | null>(null);

    const fetchFeed = useCallback(async (sourceKey: string, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(false);

        const bustParam = isRefresh ? `&bust=${Date.now()}` : "";
        try {
            const res = await fetch(
                `/api/feed/rss?limit=30&source=${encodeURIComponent(sourceKey)}${bustParam}`,
                { cache: isRefresh ? "no-store" : "default" }
            );
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setItems(data.items || []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchFeed(activeSource); }, [activeSource, fetchFeed]);

    // Keyboard + scroll lock for drawer
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedArticle(null); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);
    useEffect(() => {
        document.body.style.overflow = selectedArticle ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [selectedArticle]);

    return (
        <>
            <div className="ig-card mb-1 overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-border/20">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Globe className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-none">Dev Feed</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Latest from the tech world</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchFeed(activeSource, true)}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-full hover:bg-muted transition-all disabled:opacity-40"
                        >
                            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Source pill tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
                        {SOURCES.map((src) => (
                            <button
                                key={src.key}
                                onClick={() => setActiveSource(src.key)}
                                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${activeSource === src.key
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                {src.icon}
                                {src.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feed body */}
                {loading ? (
                    <SkeletonLoader />
                ) : error ? (
                    <ErrorState onRetry={() => fetchFeed(activeSource)} />
                ) : items.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">No articles found.</div>
                ) : (
                    <div className="divide-y divide-border/10">
                        {items.map((item) => (
                            <ArticleCard key={item.id} item={item} onOpen={() => setSelectedArticle(item)} />
                        ))}
                    </div>
                )}

                {/* Footer */}
                {!loading && !error && (
                    <div className="px-4 py-2.5 border-t border-border/10 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground/40">{items.length} articles · 10 min cache</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                            <Rss className="h-2.5 w-2.5" /> 6 sources
                        </div>
                    </div>
                )}
            </div>

            <ArticleDrawer article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        </>
    );
}

// ── Uniform article card (same size for every article) ───────────────────────
function ArticleCard({ item, onOpen }: { item: RssItem; onOpen: () => void }) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const excerpt = trimSummary(item.summary);

    return (
        <div className="px-4 py-4 hover:bg-muted/20 transition-colors">
            {/* Author row */}
            <div className="flex items-center gap-2.5 mb-2.5">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border border-border/20"
                    style={{ backgroundColor: `${item.sourceColor}18` }}
                >
                    {item.sourceEmoji}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold leading-none">{item.sourceName}</span>
                        {item.author && item.author !== item.sourceName && (
                            <span className="text-[11px] text-muted-foreground/60 truncate">· {item.author}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground/60">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(item.publishedAt)}
                    </div>
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-primary/40 flex-shrink-0" />
            </div>

            {/* Title + excerpt — clickable */}
            <button onClick={onOpen} className="w-full text-left group">
                <h3 className="text-[14px] font-semibold leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                </h3>
                {excerpt && (
                    <p className="text-[12px] text-muted-foreground/80 leading-relaxed line-clamp-3">
                        {excerpt}
                    </p>
                )}
            </button>

            {/* Tags */}
            {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-0.5 mt-2.5 -ml-1.5">
                <button
                    onClick={() => setLiked((v) => !v)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all text-xs ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400 hover:bg-muted"
                        }`}
                >
                    <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} />
                </button>
                <button
                    onClick={onOpen}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs"
                >
                    <MessageCircle className="h-4 w-4" />
                </button>
                <button
                    onClick={() => { navigator.clipboard.writeText(item.url); }}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs"
                >
                    <Share2 className="h-4 w-4" />
                </button>
                <div className="flex-1" />
                <button
                    onClick={() => setSaved((v) => !v)}
                    className={`p-1.5 rounded-full transition-all ${saved ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted"
                        }`}
                >
                    <Bookmark className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} />
                </button>
            </div>
        </div>
    );
}

// ── Article Drawer ─────────────────────────────────────────────────────────────
function ArticleDrawer({ article, onClose }: { article: RssItem | null; onClose: () => void }) {
    const isOpen = !!article;
    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />
            <div
                className={`fixed top-0 right-0 h-full z-50 w-full max-w-2xl bg-background border-l border-border/20 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {article && <DrawerContent article={article} onClose={onClose} />}
            </div>
        </>
    );
}

function DrawerContent({ article, onClose }: { article: RssItem; onClose: () => void }) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);

    return (
        <>
            {/* Drawer header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20 flex-shrink-0">
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: article.sourceColor, backgroundColor: `${article.sourceColor}18` }}
                >
                    {article.sourceEmoji} {article.sourceName}
                </span>
                <div className="flex-1" />
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-all"
                >
                    <ExternalLink className="h-3.5 w-3.5" /> Original
                </a>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Author row */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border/10">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${article.sourceColor}18` }}
                    >
                        {article.sourceEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{article.sourceName}</p>
                        <p className="text-[11px] text-muted-foreground">
                            {article.author} · {timeAgo(article.publishedAt)}
                        </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={() => setLiked((v) => !v)}
                            className={`p-1.5 rounded-full ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
                        >
                            <Heart className={`h-4.5 w-4.5 ${liked ? "fill-red-500" : ""}`} />
                        </button>
                        <button
                            onClick={() => setSaved((v) => !v)}
                            className={`p-1.5 rounded-full ${saved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        >
                            <Bookmark className={`h-4.5 w-4.5 ${saved ? "fill-primary" : ""}`} />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <h1 className="text-xl font-bold leading-snug mb-3">{article.title}</h1>

                    {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                            {article.tags.map((t) => (
                                <span key={t} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    {article.summary ? (
                        <div>
                            <p className="text-sm text-foreground/80 leading-7">{article.summary}</p>
                            <div className="mt-8 p-5 rounded-2xl bg-muted/40 border border-border/30 flex flex-col gap-3 items-center text-center">
                                <div className="text-3xl">{article.sourceEmoji}</div>
                                <p className="text-sm font-semibold">Read full article on {article.sourceName}</p>
                                <p className="text-xs text-muted-foreground">Full content, comments, and more await you</p>
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    Read full article
                                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                                <BookOpen className="h-4 w-4" /> Open article
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonLoader() {
    return (
        <div className="divide-y divide-border/10">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-4 animate-pulse">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded w-24" />
                            <div className="h-2.5 bg-muted rounded w-16" />
                        </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-5/6 mb-1.5" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2.5" />
                    <div className="h-3 bg-muted rounded w-full mb-1" />
                    <div className="h-3 bg-muted rounded w-4/5 mb-1" />
                    <div className="h-3 bg-muted rounded w-3/5 mb-3" />
                    <div className="flex gap-1.5">
                        <div className="h-5 w-8 bg-muted rounded-full" />
                        <div className="h-5 w-8 bg-muted rounded-full" />
                        <div className="h-5 w-8 bg-muted rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
            <Zap className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Couldn't load articles</p>
            <button onClick={onRetry} className="text-xs font-semibold text-primary hover:opacity-70">
                Try again
            </button>
        </div>
    );
}
