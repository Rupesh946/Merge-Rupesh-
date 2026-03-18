"use client";

import { useState, useEffect } from "react";
import { ExternalLink, TrendingUp, MessageSquare, ChevronUp, RefreshCw, Flame, Zap, Award } from "lucide-react";

interface HNPost {
    id: string;
    hnId: number;
    title: string;
    url: string;
    score: number;
    commentCount: number;
    author: string;
    createdAt: string;
    domain: string | null;
    source: "hackernews";
}

type FeedType = "top" | "new" | "best";

function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

export function TrendingSection() {
    const [stories, setStories] = useState<HNPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [feedType, setFeedType] = useState<FeedType>("top");
    const [refreshing, setRefreshing] = useState(false);

    const fetchStories = async (type: FeedType, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(false);

        try {
            const res = await fetch(
                `/api/feed/trending?type=${type}&limit=20&bust=${isRefresh ? Date.now() : ""}`,
                { cache: isRefresh ? "no-store" : "default" }
            );
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setStories(data.stories || []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStories(feedType);
    }, [feedType]);

    const tabs: { key: FeedType; label: string; icon: React.ReactNode }[] = [
        { key: "top", label: "Top", icon: <Flame className="h-3 w-3" /> },
        { key: "best", label: "Best", icon: <Award className="h-3 w-3" /> },
        { key: "new", label: "New", icon: <Zap className="h-3 w-3" /> },
    ];

    return (
        <div className="ig-card mb-0.5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-500/15">
                        <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <span className="text-sm font-semibold">Trending on HN</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                        LIVE
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Feed type tabs */}
                    <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFeedType(tab.key)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${feedType === tab.key
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={() => fetchStories(feedType, true)}
                        disabled={refreshing}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-border/10">
                {loading ? (
                    // Skeleton loader
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                            <div className="flex-shrink-0 w-8 flex flex-col items-center gap-1 pt-0.5">
                                <div className="w-4 h-4 bg-muted rounded" />
                                <div className="w-6 h-2.5 bg-muted rounded" />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 bg-muted rounded w-5/6" />
                                <div className="h-3.5 bg-muted rounded w-2/3" />
                                <div className="h-2.5 bg-muted rounded w-1/3 mt-1" />
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                        <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Couldn't load HN stories</p>
                        <button
                            onClick={() => fetchStories(feedType)}
                            className="text-xs text-primary hover:opacity-70 font-semibold"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    stories.map((story, index) => (
                        <StoryRow key={story.id} story={story} rank={index + 1} />
                    ))
                )}
            </div>

            {/* Footer */}
            {!loading && !error && (
                <div className="px-4 py-2.5 border-t border-border/10 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/60">
                        Data from Hacker News · refreshes every 5 min
                    </span>
                    <a
                        href="https://news.ycombinator.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-orange-500 hover:opacity-70 font-semibold flex items-center gap-1 transition-opacity"
                    >
                        news.ycombinator.com
                        <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                </div>
            )}
        </div>
    );
}

function StoryRow({ story, rank }: { story: HNPost; rank: number }) {
    const [upvoted, setUpvoted] = useState(false);

    const hnCommentsUrl = `https://news.ycombinator.com/item?id=${story.hnId}`;

    return (
        <div className="px-4 py-3 flex gap-3 hover:bg-muted/20 transition-colors group">
            {/* Rank + upvote */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1 w-8 pt-0.5">
                <button
                    onClick={() => setUpvoted((v) => !v)}
                    className={`flex flex-col items-center transition-colors ${upvoted ? "text-orange-500" : "text-muted-foreground/50 hover:text-orange-400"
                        }`}
                    title="Upvote"
                >
                    <ChevronUp className="h-4 w-4" />
                </button>
                <span className={`text-[10px] font-bold tabular-nums ${rank <= 3 ? "text-orange-500" : "text-muted-foreground/60"
                    }`}>
                    {story.score}
                </span>
            </div>

            {/* Story content */}
            <div className="flex-1 min-w-0">
                <a
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group-hover:text-primary transition-colors"
                >
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                        {story.title}
                        <ExternalLink className="inline-block h-3 w-3 ml-1 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                    </p>
                </a>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {story.domain && (
                        <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                            {story.domain}
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/50">by {story.author}</span>
                    <span className="text-[10px] text-muted-foreground/40">·</span>
                    <span className="text-[10px] text-muted-foreground/50">{timeAgo(story.createdAt)}</span>
                    <a
                        href={hnCommentsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors ml-auto"
                    >
                        <MessageSquare className="h-3 w-3" />
                        {story.commentCount}
                    </a>
                </div>
            </div>
        </div>
    );
}
