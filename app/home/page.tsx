"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/navbar";
import { useApi } from "@/hooks/use-api";
import { api, Post, User } from "@/lib/api";
import {
    Heart,
    MessageCircle,
    Bookmark,
    MoreHorizontal,
    Code2,
    Send,
    Loader2,
    ArrowRight,
    Plus,
    UserPlus,
    ExternalLink,
    Zap,
    Cpu,
    Globe,
    Layers,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
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
    category: "ai" | "coding" | "design" | "devops" | "news";
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Animated Background ──────────────────────────────────────────────────────
function GridBackground() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
                    backgroundSize: "80px 80px",
                    animation: "gridMove 30s linear infinite",
                }}
            />
            <div className="absolute top-1/4 left-[8%] text-primary/10 text-5xl font-mono animate-pulse select-none">
                {"{}"}
            </div>
            <div
                className="absolute top-1/2 right-[12%] text-primary/8 text-3xl font-mono animate-pulse select-none"
                style={{ animationDelay: "3s" }}
            >
                {"</>"}
            </div>
            <div
                className="absolute bottom-1/4 left-[20%] text-primary/10 text-4xl font-mono animate-pulse select-none"
                style={{ animationDelay: "6s" }}
            >
                {"()"}
            </div>
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: "1s" }} />
            <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: "4s" }} />
        </div>
    );
}

// ─── Post Card (user posts) ───────────────────────────────────────────────────
function PostCard({ post: initial, index }: { post: Post; index: number }) {
    const [post, setPost] = useState(initial);
    const [hearted, setHearted] = useState(!!initial.isLiked);
    const [bookmarked, setBookmarked] = useState(!!initial.isBookmarked);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [localComments, setLocalComments] = useState(initial.comments ?? []);

    const toggleHeart = async () => {
        const was = hearted;
        setHearted(!was);
        setPost((p) => ({ ...p, _count: { ...p._count, likes: p._count.likes + (was ? -1 : 1) } }));
        try {
            if (was) await api.unlikePost(post.id);
            else await api.likePost(post.id);
        } catch {
            setHearted(was);
            setPost((p) => ({ ...p, _count: { ...p._count, likes: p._count.likes + (was ? 1 : -1) } }));
        }
    };

    const toggleBookmark = async () => {
        const was = bookmarked;
        setBookmarked(!was);
        try {
            if (was) await api.unbookmarkPost(post.id);
            else await api.bookmarkPost(post.id);
        } catch { setBookmarked(was); }
    };

    const submitComment = async () => {
        if (!commentText.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await api.addPostComment(post.id, commentText.trim());
            setLocalComments((p) => [...p, res.comment]);
            setPost((p) => ({ ...p, _count: { ...p._count, comments: p._count.comments + 1 } }));
            setCommentText("");
        } finally { setSubmitting(false); }
    };

    return (
        <article className="relative border-t border-primary/15 py-8 group">
            <div className="absolute top-8 right-0 text-xs font-mono text-muted-foreground/20 select-none">
                {String(index + 1).padStart(2, "0")}
            </div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-6 h-px bg-primary/60" />
                    <Link href={`/profile/${post.author.username}`} className="flex items-center space-x-3 group/author">
                        <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarImage src={post.author.image ?? ""} />
                            <AvatarFallback className="text-xs font-light bg-primary/10 text-primary">
                                {(post.author.name ?? post.author.username)[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs font-light tracking-[0.1em] uppercase group-hover/author:text-primary transition-colors">
                                {post.author.username}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground/50">{timeAgo(post.createdAt)}</p>
                        </div>
                    </Link>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-muted-foreground p-1">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="pl-[calc(1.5rem+1.5rem+0.75rem)]">
                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] font-light border-primary/30 text-primary uppercase tracking-[0.1em] px-2 py-0">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
                <p className="text-base font-light story-text text-foreground/90 leading-relaxed mb-5">{post.content}</p>
                {post.codeSnippet && (
                    <div className="border border-primary/20 bg-primary/5 mb-5 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-primary/10">
                            <div className="flex items-center space-x-2">
                                <Code2 className="h-3 w-3 text-primary/60" />
                                <span className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.1em]">{post.codeLanguage || "code"}</span>
                            </div>
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 rounded-full bg-primary/20" /><div className="w-2 h-2 rounded-full bg-primary/30" /><div className="w-2 h-2 rounded-full bg-primary/40" />
                            </div>
                        </div>
                        <pre className="p-4 text-xs font-mono overflow-auto max-h-48 text-foreground/80">
                            <code>{post.codeSnippet.substring(0, 400)}{post.codeSnippet.length > 400 ? "…" : ""}</code>
                        </pre>
                    </div>
                )}
                {post.imageUrl && (
                    <div className="border border-primary/10 overflow-hidden mb-5">
                        <img src={post.imageUrl} alt="" className="w-full object-cover max-h-[360px]" />
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button onClick={toggleHeart} className="flex items-center space-x-2 group/btn">
                            <Heart className={`h-4 w-4 transition-all ${hearted ? "text-primary fill-primary scale-110" : "text-muted-foreground group-hover/btn:text-primary"}`} />
                            <span className="text-xs font-mono text-muted-foreground group-hover/btn:text-primary transition-colors">
                                {post._count.likes > 0 ? post._count.likes : ""}
                            </span>
                        </button>
                        <button onClick={() => setShowComments((s) => !s)} className="flex items-center space-x-2 group/btn">
                            <MessageCircle className="h-4 w-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                            <span className="text-xs font-mono text-muted-foreground group-hover/btn:text-primary transition-colors">
                                {post._count.comments > 0 ? post._count.comments : ""}
                            </span>
                        </button>
                    </div>
                    <button onClick={toggleBookmark} className="group/btn">
                        <Bookmark className={`h-4 w-4 transition-all ${bookmarked ? "text-primary fill-primary" : "text-muted-foreground group-hover/btn:text-primary"}`} />
                    </button>
                </div>
                {showComments && (
                    <div className="mt-5 space-y-3 border-t border-primary/10 pt-4">
                        {localComments.map((c) => (
                            <div key={c.id} className="flex items-start space-x-3">
                                <Avatar className="h-6 w-6 border border-border/30 shrink-0">
                                    <AvatarImage src={c.author.image ?? ""} />
                                    <AvatarFallback className="text-[9px] bg-muted">{c.author.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <span className="text-xs font-light tracking-[0.05em] text-primary mr-2">{c.author.username}</span>
                                    <span className="text-xs font-light text-foreground/80">{c.content}</span>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center space-x-3 mt-3">
                            <div className="w-6 h-px bg-primary/40 shrink-0" />
                            <input
                                type="text"
                                placeholder="Add a comment…"
                                className="flex-1 bg-transparent text-xs font-light text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-primary/20 pb-1 focus:border-primary/60 transition-colors"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                            />
                            {commentText.trim() && (
                                <button onClick={submitComment} disabled={submitting} className="text-primary disabled:opacity-50">
                                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}



// ─── News Card (RSS) ──────────────────────────────────────────────────────────
function NewsCard({ item, index }: { item: RssItem; index: number }) {
    const categoryColor: Record<string, string> = {
        ai: "text-emerald-500 border-emerald-500/30",
        coding: "text-primary border-primary/30",
        design: "text-pink-500 border-pink-500/30",
        news: "text-amber-500 border-amber-500/30",
        devops: "text-cyan-500 border-cyan-500/30",
    };

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-t border-primary/10 py-6 group relative hover:bg-primary/[0.02] transition-colors -mx-2 px-2"
        >
            {/* Index number */}
            <div className="absolute top-6 right-2 text-xs font-mono text-muted-foreground/15 select-none">
                {String(index + 1).padStart(2, "0")}
            </div>

            <div className="flex items-start gap-4">
                {/* Source badge column */}
                <div className="shrink-0 mt-0.5">
                    <div
                        className="w-8 h-8 flex items-center justify-center text-sm border border-border/20"
                        style={{ backgroundColor: item.sourceColor + "18" }}
                    >
                        {item.sourceEmoji}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Source + category + time */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-light text-muted-foreground/60 uppercase tracking-[0.12em]">
                            {item.sourceName}
                        </span>
                        <div className="w-px h-3 bg-border/40" />
                        <Badge
                            variant="outline"
                            className={`text-[9px] font-light uppercase tracking-[0.1em] px-1.5 py-0 h-4 ${categoryColor[item.category] || "text-primary border-primary/30"}`}
                        >
                            {item.category}
                        </Badge>
                        <div className="w-px h-3 bg-border/40" />
                        <span className="text-[10px] font-mono text-muted-foreground/40">{timeAgo(item.publishedAt)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-light leading-snug mb-2 group-hover:text-primary transition-colors story-text line-clamp-2 pr-6">
                        {item.title}
                    </h3>

                    {/* Summary */}
                    {item.summary && (
                        <p className="text-xs font-light text-muted-foreground/60 story-text line-clamp-2 leading-relaxed">
                            {item.summary}
                        </p>
                    )}

                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-3">
                        {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-mono text-muted-foreground/40">
                                #{tag}
                            </span>
                        ))}
                        <ExternalLink className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary ml-auto transition-colors" />
                    </div>
                </div>

                {/* Thumbnail */}
                {item.imageUrl && (
                    <div className="shrink-0 w-16 h-16 border border-primary/10 overflow-hidden hidden sm:block">
                        <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                )}
            </div>
        </a>
    );
}

// ─── Infinite News Feed ───────────────────────────────────────────────────────
const CATEGORIES = [
    { id: "all", label: "All", icon: <Globe className="h-3 w-3" /> },
    { id: "ai", label: "AI", icon: <Cpu className="h-3 w-3" /> },
    { id: "coding", label: "Coding", icon: <Code2 className="h-3 w-3" /> },
    { id: "news", label: "News", icon: <Zap className="h-3 w-3" /> },
    { id: "design", label: "Design", icon: <Layers className="h-3 w-3" /> },
];

function InfiniteNewsFeed() {
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<RssItem[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const LIMIT = 12;

    const loadingRef = useRef(false);

    const fetchNews = useCallback(async (pg: number, cat: string, reset = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const url = `/api/feed/rss?limit=${LIMIT}&page=${pg}&category=${cat}`;
            const res = await fetch(url);
            const data = await res.json();
            setItems((prev) => reset ? data.items : [...prev, ...data.items]);
            setHasMore(data.hasMore);
        } catch {
            //
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setInitialLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        setInitialLoading(true);
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchNews(1, category, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    // Infinite scroll observer
    useEffect(() => {
        const el = bottomRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchNews(nextPage, category);
                }
            },
            { threshold: 0.1, rootMargin: "200px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, page, category, fetchNews]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setItems([]);
        setPage(1);
        setHasMore(true);
        await fetchNews(1, category, true);
    };

    return (
        <div>
            {/* Section header */}
            <div className="flex items-center justify-between mb-6 pt-8 border-t border-primary/10">
                <div className="flex items-center space-x-4">
                    <div className="w-8 h-px bg-primary" />
                    <span className="text-xs font-light text-primary uppercase tracking-[0.2em]">
                        Tech &amp; AI News
                    </span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="flex items-center space-x-1.5 text-[10px] font-light text-muted-foreground/40 hover:text-primary transition-colors uppercase tracking-[0.1em] disabled:opacity-30"
                >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Category filter strip */}
            <div className="flex items-center gap-1 mb-6 flex-wrap">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-light uppercase tracking-[0.12em] border transition-all ${category === cat.id
                            ? "border-primary/60 text-primary bg-primary/8"
                            : "border-border/30 text-muted-foreground/50 hover:border-primary/30 hover:text-foreground"
                            }`}
                    >
                        {cat.icon}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* News items */}
            {initialLoading ? (
                <div className="space-y-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border-t border-primary/10 py-6 flex gap-4">
                            <div className="w-8 h-8 bg-muted/40 shrink-0 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-2.5 w-32 bg-muted/40 rounded animate-pulse" />
                                <div className="h-3.5 w-full bg-muted/30 rounded animate-pulse" />
                                <div className="h-3.5 w-4/5 bg-muted/30 rounded animate-pulse" />
                                <div className="h-3 w-3/5 bg-muted/20 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="border-t border-primary/10 py-16 text-center">
                    <div className="text-4xl font-extralight text-muted-foreground/10 mb-4 tracking-[-0.04em]">NO FEED</div>
                    <p className="text-xs font-light text-muted-foreground/40">Could not load news. Try refreshing.</p>
                </div>
            ) : (
                <div>
                    {items.map((item, i) => (
                        <NewsCard key={item.id} item={item} index={i} />
                    ))}
                </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={bottomRef} className="py-4 flex items-center justify-center">
                {loading && !initialLoading && (
                    <div className="flex items-center space-x-3 text-xs font-light text-muted-foreground/40 uppercase tracking-[0.15em]">
                        <Loader2 className="h-3 w-3 animate-spin text-primary/50" />
                        <span>Loading more…</span>
                    </div>
                )}
                {!hasMore && !loading && items.length > 0 && (
                    <div className="flex items-center space-x-4 w-full">
                        <div className="flex-1 h-px bg-primary/10" />
                        <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em]">End of feed</span>
                        <div className="flex-1 h-px bg-primary/10" />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Suggested User Row ───────────────────────────────────────────────────────
function SuggestedRow({ user }: { user: User }) {
    const [following, setFollowing] = useState(!!user.isFollowing);
    const toggle = async () => {
        const was = following;
        setFollowing(!was);
        try {
            if (was) await api.unfollowUser(user.username);
            else await api.followUser(user.username);
        } catch { setFollowing(was); }
    };
    return (
        <div className="flex items-center justify-between py-3 border-b border-primary/10 group">
            <div className="flex items-center space-x-3 min-w-0">
                <div className="w-4 h-px bg-primary/30 shrink-0" />
                <Link href={`/profile/${user.username}`}>
                    <Avatar className="h-7 w-7 border border-primary/15">
                        <AvatarImage src={user.image ?? ""} />
                        <AvatarFallback className="text-[10px] font-light bg-primary/10 text-primary">
                            {(user.name ?? user.username)[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="min-w-0">
                    <Link href={`/profile/${user.username}`}>
                        <p className="text-xs font-light tracking-[0.05em] uppercase truncate hover:text-primary transition-colors">{user.username}</p>
                    </Link>
                    {user.bio && <p className="text-[10px] text-muted-foreground/50 font-light truncate mt-0.5">{user.bio}</p>}
                </div>
            </div>
            <button onClick={toggle} className="ml-3 shrink-0">
                {following ? (
                    <span className="text-[10px] font-light uppercase tracking-[0.1em] text-muted-foreground/50 hover:text-destructive transition-colors">Unfollow</span>
                ) : (
                    <UserPlus className="h-3.5 w-3.5 text-primary/50 hover:text-primary transition-colors" />
                )}
            </button>
        </div>
    );
}

// ─── Connect Row ──────────────────────────────────────────────────────────────
function ConnectRow({ user }: { user: User }) {
    const [following, setFollowing] = useState(!!user.isFollowing);
    const toggle = async () => {
        const was = following;
        setFollowing(!was);
        try {
            if (was) await api.unfollowUser(user.username);
            else await api.followUser(user.username);
        } catch { setFollowing(was); }
    };
    return (
        <div className="flex items-center gap-2 py-2.5 border-b border-primary/8 group hover:bg-primary/[0.02] transition-colors -mx-1 px-1 rounded">
            {/* Avatar → profile */}
            <Link href={`/profile/${user.username}`} className="shrink-0">
                <Avatar className="h-8 w-8 border border-primary/15 group-hover:border-primary/30 transition-colors">
                    <AvatarImage src={user.image ?? ""} />
                    <AvatarFallback className="text-[10px] font-light bg-primary/10 text-primary">
                        {(user.name ?? user.username)[0].toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </Link>

            {/* Name + bio → profile posts */}
            <Link href={`/profile/${user.username}`} className="flex-1 min-w-0">
                <p className="text-[11px] font-light tracking-[0.06em] uppercase truncate group-hover:text-primary transition-colors leading-tight">
                    {user.username}
                </p>
                {user.bio && (
                    <p className="text-[9px] text-muted-foreground/40 font-light truncate mt-0.5 leading-tight">
                        {user.bio}
                    </p>
                )}
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Chat button */}
                <Link
                    href={`/messages?user=${user.username}`}
                    className="text-muted-foreground/30 hover:text-primary transition-colors"
                    title={`Message ${user.username}`}
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                </Link>

                {/* Follow / Unfollow */}
                <button onClick={toggle} title={following ? "Unfollow" : "Follow"}>
                    {following ? (
                        <span className="text-[9px] font-light uppercase tracking-[0.1em] text-muted-foreground/40 hover:text-destructive transition-colors">
                            ✓
                        </span>
                    ) : (
                        <UserPlus className="h-3.5 w-3.5 text-primary/40 hover:text-primary transition-colors" />
                    )}
                </button>
            </div>
        </div>
    );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
    const { data: feedData, loading: feedLoading } = useApi(() => api.getFeed({ page: 1, limit: 15 }), []);
    const { data: suggestedData } = useApi(() => api.getSuggestedUsers(8), []);
    const { data: meData } = useApi(() => api.getCurrentUser(), []);

    const feed = feedData?.posts ?? [];
    const suggested = suggestedData?.users ?? [];
    const currentUser = meData?.user ?? null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentPage="home" />

            <div className="pt-16 relative">
                <GridBackground />

                <div className="max-w-7xl mx-auto px-8 relative z-10">

                    {/* Main grid */}
                    <div className="grid lg:grid-cols-12 gap-16 mt-0">

                        {/* Feed column — 8 cols */}
                        <div className="lg:col-span-8">

                            {/* ─── Infinite news feed (top) ─────────────────── */}
                            <InfiniteNewsFeed />

                            {/* User posts */}
                            {feedLoading ? (
                                <div>
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="border-t border-primary/10 py-8">
                                            <div className="flex items-center space-x-4 mb-5">
                                                <div className="w-6 h-px bg-primary/20" />
                                                <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse" />
                                                <div className="space-y-1.5">
                                                    <div className="h-2.5 w-24 bg-muted/50 rounded animate-pulse" />
                                                    <div className="h-2 w-14 bg-muted/30 rounded animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="pl-[calc(1.5rem+2rem+0.75rem)] space-y-3">
                                                <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                                                <div className="h-3 w-4/5 bg-muted/40 rounded animate-pulse" />
                                                <div className="h-3 w-3/5 bg-muted/30 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : feed.length > 0 ? (
                                <div>
                                    {feed.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
                                </div>
                            ) : null}
                        </div>

                        {/* Sidebar — 4 cols */}
                        <div className="hidden lg:block lg:col-span-4 border-l border-primary/10 pl-8">
                            <div className="sticky top-16 space-y-5">

                                {/* Profile */}
                                {currentUser && (
                                    <div>
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-6 h-px bg-primary/60" />
                                            <span className="text-[10px] font-light text-primary uppercase tracking-[0.2em]">You</span>
                                        </div>
                                        <Link href={`/profile/${currentUser.username}`} className="flex items-center space-x-4 group">
                                            <Avatar className="h-10 w-10 border border-primary/20">
                                                <AvatarImage src={currentUser.image ?? ""} />
                                                <AvatarFallback className="text-sm font-light bg-primary/10 text-primary">
                                                    {(currentUser.name ?? currentUser.username)[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-light tracking-[0.08em] uppercase group-hover:text-primary transition-colors truncate">{currentUser.username}</p>
                                                {currentUser.name && <p className="text-[11px] font-light text-muted-foreground/50 truncate">{currentUser.name}</p>}
                                            </div>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary transition-colors ml-auto shrink-0" />
                                        </Link>
                                        {currentUser._count && (
                                            <div className="flex items-center space-x-6 mt-4 pl-[calc(2.5rem+1rem)]">
                                                {[
                                                    { val: currentUser._count.followers, label: "Followers" },
                                                    { val: currentUser._count.following, label: "Following" },
                                                    { val: currentUser._count.posts, label: "Posts" },
                                                ].map((stat, i) => (
                                                    <div key={stat.label} className="flex items-center space-x-6">
                                                        {i > 0 && <div className="w-px h-6 bg-primary/10" />}
                                                        <div>
                                                            <p className="text-sm font-light font-mono">{stat.val}</p>
                                                            <p className="text-[10px] font-light text-muted-foreground/40 uppercase tracking-[0.1em]">{stat.label}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="w-full h-px bg-primary/10" />

                                {/* Suggested users */}
                                {suggested.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-6 h-px bg-primary/60" />
                                                <span className="text-[10px] font-light text-primary uppercase tracking-[0.2em]">Who to Follow</span>
                                            </div>
                                        </div>
                                        <div>
                                            {suggested.slice(0, 6).map((u) => <SuggestedRow key={u.id} user={u} />)}
                                        </div>
                                    </div>
                                )}


                                {/* Connect to People */}
                                {suggested.length > 0 && (
                                    <div>
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-6 h-px bg-primary/60" />
                                            <span className="text-[10px] font-light text-primary uppercase tracking-[0.2em]">Connect</span>
                                        </div>
                                        <div className="space-y-1">
                                            {suggested.slice(0, 5).map((u) => (
                                                <ConnectRow key={u.id} user={u} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <p className="text-[10px] font-light text-muted-foreground/20 uppercase tracking-[0.1em]">© 2025 MERGE</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
