"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { useApi } from "@/hooks/use-api";
import { api, transformFeedItem, FeedItem } from "@/lib/api";
import {
  Code2,
  Heart,
  MessageCircle,
  Share,
  ExternalLink,
  Star,
  GitFork,
  TrendingUp,
  Search,
  Plus,
  Settings,
  X,
  ArrowUp
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

// Enhanced mock data
const mockFeedItems: FeedItem[] = [
  {
    id: "1",
    type: "project",
    title: "Neural Network Visualizer",
    description: "Real-time visualization of neural network training processes built with Three.js and WebGL shaders.",
    author: {
      id: "user-1",
      name: "Sarah Chen",
      username: "neural_dev",
      image: "/api/placeholder/40/40",
      createdAt: new Date().toISOString()
    },
    stats: { stars: 2147, forks: 234, likes: 89 },
    tags: ["TypeScript", "WebGL", "Three.js"],
    timeAgo: "3 hours ago",
    featured: true
  },
  {
    id: "2",
    type: "blog",
    title: "The Art of Writing Readable Code",
    description: "Exploring the philosophy behind clean code and how it impacts team productivity and maintainability.",
    author: {
      id: "user-2",
      name: "Alex Rodriguez",
      username: "code_poet",
      image: "/api/placeholder/40/40",
      createdAt: new Date().toISOString()
    },
    stats: { likes: 156, comments: 23, readTime: "8 min" },
    tags: ["Clean Code", "Philosophy", "Best Practices"],
    timeAgo: "6 hours ago",
    featured: false
  },
  {
    id: "3",
    type: "news",
    title: "Rust Foundation Announces New Memory Safety Initiative",
    description: "A comprehensive program to advance memory safety across the software industry.",
    author: {
      id: "user-3",
      name: "Tech News",
      username: "technews",
      image: "/api/placeholder/40/40",
      createdAt: new Date().toISOString()
    },
    stats: { points: 342, comments: 67 },
    tags: ["Rust", "Memory Safety", "Industry"],
    timeAgo: "12 hours ago",
    featured: false
  },
  {
    id: "4",
    type: "project",
    title: "Quantum State Manager",
    description: "State management library inspired by quantum mechanics principles. Superposition meets React.",
    author: {
      id: "user-4",
      name: "Emma Davis",
      username: "quantum_coder",
      image: "/api/placeholder/40/40",
      createdAt: new Date().toISOString()
    },
    stats: { stars: 1834, forks: 156, likes: 234 },
    tags: ["React", "Quantum", "State Management"],
    timeAgo: "1 day ago",
    featured: false
  }
];

const mockTrendingTags = [
  { name: "react", count: 1247 },
  { name: "typescript", count: 892 },
  { name: "ai", count: 756 },
  { name: "webgl", count: 423 },
  { name: "rust", count: 389 },
  { name: "nextjs", count: 334 }
];

const featuredDevelopers = [
  {
    name: "Maya Patel",
    username: "maya_builds",
    bio: "Building the future of web interfaces",
    followers: 2341,
    image: "/api/placeholder/40/40"
  },
  {
    name: "Jordan Kim",
    username: "j_algorithms",
    bio: "Algorithms & data structures enthusiast",
    followers: 1876,
    image: "/api/placeholder/40/40"
  },
  {
    name: "Casey Morgan",
    username: "design_dev",
    bio: "Where design meets development",
    followers: 1654,
    image: "/api/placeholder/40/40"
  }
];

export default function HomePage() {
  const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Initial load only
  const { data: initialFeedData, loading: feedLoading, error: feedError } = useApi(
    () => api.getFeed({ limit: 15, page: 1 }),
    [] // No dependencies - only load once
  );

  // Fetch trending tags
  const { data: trendingData, loading: trendingLoading } = useApi(
    () => api.getTrendingTags(),
    []
  );

  // Handle initial load
  useEffect(() => {
    if (initialFeedData?.items) {
      const transformedItems = initialFeedData.items.map(transformFeedItem);
      setAllFeedItems(transformedItems);
      setHasMore(initialFeedData.pagination?.hasMore || false);
      setInitialLoading(false);
    } else if (feedError) {
      // Use mock data if API fails
      setAllFeedItems(mockFeedItems);
      setHasMore(false);
      setInitialLoading(false);
      setError(feedError);
    }
  }, [initialFeedData, feedError]);

  // Load more function
  const loadMoreItems = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const response = await api.getFeed({ limit: 15, page: nextPage });

      if (response?.items) {
        const transformedItems = response.items.map(transformFeedItem);

        // Filter out duplicates
        setAllFeedItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = transformedItems.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });

        setHasMore(response.pagination?.hasMore || false);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more items:', error);
      setError(error as any);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll implementation
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Show/hide scroll to top button
    setShowScrollTop(scrollTop > 400);

    // Load more content when near bottom
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 && // Load when 1000px from bottom
      hasMore &&
      !isLoadingMore &&
      !initialLoading
    ) {
      loadMoreItems();
    }
  }, [hasMore, isLoadingMore, initialLoading, loadMoreItems]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Use accumulated feed items or empty array while loading
  const feedItems = allFeedItems;
  const trendingTags = trendingData?.tags || mockTrendingTags;

  if (error) {
    console.warn('Failed to load feed data:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="home" />

      <div className="pt-20 px-8">
        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Main Feed */}
            <div className="lg:col-span-8">
              {/* Simple Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    placeholder="Search your feed..."
                    className="pl-12 bg-muted/30 border-primary/20 font-light focus:border-primary/40"
                  />
                </div>
              </div>

              {/* Feed Items */}
              <div className="space-y-8">
                {initialLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-primary/20 bg-card/30">
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-3" />
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted rounded animate-pulse" />
                          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                ) : (
                  feedItems.map((item, index) => (
                    <Card key={`${item.id}-${index}`} className="border-primary/20 bg-card/30 hover-lift">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={item.author.image || "/api/placeholder/40/40"} />
                              <AvatarFallback className="text-xs">{item.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-light">{item.author.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">@{item.author.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {item.featured && (
                              <Badge variant="outline" className="font-light border-primary/40 text-primary text-xs uppercase tracking-[0.1em]">
                                Featured
                              </Badge>
                            )}
                            {item.source === 'hackernews' && (
                              <Badge variant="outline" className="font-light border-orange-500/30 text-orange-500 text-xs uppercase tracking-[0.1em]">
                                HN
                              </Badge>
                            )}
                            {item.source === 'devto' && (
                              <Badge variant="outline" className="font-light border-purple-500/30 text-purple-500 text-xs uppercase tracking-[0.1em]">
                                DEV
                              </Badge>
                            )}
                            <Badge variant="outline" className="font-light border-border/30 text-xs uppercase tracking-[0.1em]">
                              {item.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">{item.timeAgo}</span>
                          </div>
                        </div>

                        <CardTitle className="text-xl font-light mb-3 hover:text-primary cursor-pointer transition-colors">
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              {item.title}
                            </a>
                          ) : item.type === 'project' ? (
                            <Link href={`/projects/${item.id}`}>
                              {item.title}
                            </Link>
                          ) : item.type === 'blog' ? (
                            <Link href={`/insights/${item.id}`}>
                              {item.title}
                            </Link>
                          ) : (
                            <span>{item.title}</span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm font-light text-muted-foreground story-text leading-relaxed">
                          {item.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-2">
                            {(item.tags || []).slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="font-light border-border/30 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground font-mono">
                            {item.type === 'project' && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>{item.stats?.stars || item.stars || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <GitFork className="h-3 w-3" />
                                  <span>{item.stats?.forks || item.forks || 0}</span>
                                </div>
                              </>
                            )}
                            {item.type === 'blog' && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{item.stats?.likes || item._count?.likes || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{item.stats?.comments || item._count?.comments || 0}</span>
                                </div>
                                {item.stats?.readTime && <span>{item.stats.readTime}</span>}
                                {item.readTime && <span>{item.readTime} min read</span>}
                              </>
                            )}
                            {item.type === 'news' && (
                              <>
                                <span>{item.stats?.points || item.points || 0} points</span>
                                <span>{item.stats?.comments || item.comments || 0} comments</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <Button variant="ghost" size="sm" className="font-light btn-no-hover">
                            <Heart className="mr-2 h-3 w-3" />
                            Like
                          </Button>
                          <Button variant="ghost" size="sm" className="font-light btn-no-hover">
                            <MessageCircle className="mr-2 h-3 w-3" />
                            Comment
                          </Button>
                          <Button variant="ghost" size="sm" className="font-light btn-no-hover">
                            <Share className="mr-2 h-3 w-3" />
                            Share
                          </Button>
                          <Button variant="ghost" size="sm" className="font-light btn-no-hover ml-auto">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Loading indicator for infinite scroll */}
                {isLoadingMore && (
                  <div className="flex justify-center mt-8 mb-8">
                    <div className="flex items-center space-x-3 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm font-light">Loading more content...</span>
                    </div>
                  </div>
                )}

                {/* End of feed indicator */}
                {!hasMore && feedItems.length > 0 && (
                  <div className="flex justify-center mt-8 mb-8">
                    <div className="text-center">
                      <div className="w-12 h-px bg-border mx-auto mb-3"></div>
                      <p className="text-sm text-muted-foreground font-light">
                        You've reached the end of your feed
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {feedItems.length} items loaded
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Trending Tags */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Trending</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trendingLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                          </div>
                          <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                        </div>
                      ))
                    ) : (
                      trendingTags.map((tag, index) => (
                        <div key={tag.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-mono text-muted-foreground w-4">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <Badge variant="outline" className="font-light border-border/30 text-xs">
                              #{tag.name}
                            </Badge>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">
                            {tag.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Featured Developers */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Featured Developers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {featuredDevelopers.map((dev) => (
                      <div key={dev.username} className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={dev.image} />
                          <AvatarFallback className="text-xs">{dev.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-light truncate">{dev.name}</p>
                            <Button size="sm" variant="outline" className="font-light text-xs px-3">
                              Follow
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">@{dev.username}</p>
                          <p className="text-xs text-muted-foreground mb-2">{dev.bio}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {dev.followers} followers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start font-light" asChild>
                      <Link href="/projects/new">
                        <Plus className="mr-3 h-4 w-4" />
                        Share a Project
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start font-light" asChild>
                      <Link href="/insights/new">
                        <Plus className="mr-3 h-4 w-4" />
                        Write an Insight
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start font-light" asChild>
                      <Link href="/profile">
                        <Settings className="mr-3 h-4 w-4" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}