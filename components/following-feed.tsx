"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Clock, Users, RefreshCw, ImageIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FollowingPost {
    id: string;
    content: string;
    imageUrl: string | null;
    tags: string[];
    createdAt: string;
    author: {
        id: string;
        name: string;
        username: string;
        image: string | null;
    };
    _count: { likes: number; comments: number };
}

function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

export function FollowingFeed() {
    const [posts, setPosts] = useState<FollowingPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const fetchPosts = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(false);

        try {
            const res = await fetch(
                `/api/feed/following?limit=10${isRefresh ? `&bust=${Date.now()}` : ""}`,
                { credentials: "include", cache: isRefresh ? "no-store" : "default" }
            );
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setPosts(data.posts || []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    return (
        <div className="rounded-2xl border border-border/20 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-blue-500/15 flex items-center justify-center">
                        <Users className="h-3 w-3 text-blue-500" />
                    </div>
                    <span className="text-[13px] font-semibold">Following</span>
                </div>
                <button
                    onClick={() => fetchPosts(true)}
                    disabled={refreshing}
                    className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Body */}
            <div className="divide-y divide-border/10">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="px-3 py-3 flex gap-2.5 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                            <div className="flex-1 space-y-1.5 pt-0.5">
                                <div className="h-2.5 bg-muted rounded w-3/4" />
                                <div className="h-2 bg-muted rounded w-full" />
                                <div className="h-2 bg-muted rounded w-2/3" />
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="px-4 py-6 text-center">
                        <p className="text-xs text-muted-foreground">Couldn't load posts</p>
                        <button
                            onClick={() => fetchPosts()}
                            className="text-xs text-primary font-semibold mt-1 hover:opacity-70"
                        >
                            Retry
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="px-4 py-6 flex flex-col items-center gap-2 text-center">
                        <Users className="h-6 w-6 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Follow people to see their posts here
                        </p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <FollowingPostRow key={post.id} post={post} />
                    ))
                )}
            </div>

            {/* Footer */}
            {!loading && !error && posts.length > 0 && (
                <div className="px-4 py-2 border-t border-border/10">
                    <Link
                        href="/feed/following"
                        className="text-[11px] font-semibold text-primary hover:opacity-70 transition-opacity"
                    >
                        See all →
                    </Link>
                </div>
            )}
        </div>
    );
}

function FollowingPostRow({ post }: { post: FollowingPost }) {
    return (
        <Link
            href={`/post/${post.id}`}
            className="flex gap-2.5 px-3 py-3 hover:bg-muted/30 transition-colors group"
        >
            {/* Avatar */}
            <Link
                href={`/profile/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
            >
                <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.image || ""} />
                    <AvatarFallback className="text-[10px] font-bold">
                        {post.author.name?.[0] || post.author.username?.[0] || "?"}
                    </AvatarFallback>
                </Avatar>
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Author row */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[12px] font-semibold leading-none group-hover:text-primary transition-colors truncate max-w-[90px]">
                        {post.author.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(post.createdAt)}
                    </span>
                </div>

                {/* Post preview */}
                <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-0.5 leading-relaxed">
                    {post.content}
                </p>

                {/* Stats + image indicator */}
                <div className="flex items-center gap-2.5 mt-1.5">
                    {post.imageUrl && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                            <ImageIcon className="h-2.5 w-2.5" />
                        </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                        <Heart className="h-2.5 w-2.5" />
                        {post._count.likes}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                        <MessageCircle className="h-2.5 w-2.5" />
                        {post._count.comments}
                    </span>
                    {post.tags.slice(0, 1).map((t) => (
                        <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono truncate max-w-[60px]">
                            #{t}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
}
