"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { useApi } from "@/hooks/use-api";
import { api, Post, User } from "@/lib/api";
import {
  Heart,
  MessageCircle,
  Share,
  TrendingUp,
  Search,
  Plus,
  Filter,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const mockTrendingTopics = [
  { name: "AI Development", count: 1247, trend: "up" },
  { name: "Rust", count: 892, trend: "up" },
  { name: "WebGL", count: 756, trend: "stable" },
  { name: "Design Systems", count: 634, trend: "up" },
  { name: "Performance", count: 523, trend: "stable" },
  { name: "Clean Code", count: 445, trend: "down" }
];

export default function InsightsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: postsData, loading, error } = useApi(
    () => api.getPosts({ limit: 20, tag: selectedTag || undefined }),
    [selectedTag]
  );

  const { data: trendingData } = useApi(
    () => api.getPosts({ limit: 5 }),
    []
  );

  const { data: tagsData } = useApi(
    () => api.getTrendingTags(),
    []
  );

  const { data: suggestedUsersData } = useApi(
    () => api.searchUsers("", 5),
    []
  );

  const posts = postsData?.posts || [];
  const trendingPosts = trendingData?.posts || [];
  const tags = tagsData?.tags || [];
  const suggestedUsers = suggestedUsersData?.users || [];

  const filteredPosts = searchQuery.trim()
    ? posts.filter(
      (p) =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.author.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : posts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="insights" />

      <div className="pt-20 px-8">
        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Page Header */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-4xl font-light mb-3 tracking-tight">Explore</h1>
                    <p className="text-base font-light text-muted-foreground">
                      Discover trending insights, news, and discussions
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" className="font-light">
                      <Filter className="mr-2 h-3 w-3" />
                      Filter
                    </Button>
                    <Button size="sm" className="font-light bg-foreground text-background" asChild>
                      <Link href="/home">
                        <Plus className="mr-2 h-3 w-3" />
                        Write Post
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    placeholder="Search posts, topics, authors..."
                    className="pl-12 bg-muted/30 border-primary/20 font-light focus:border-primary/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Tag Filters */}
                <div className="flex items-center space-x-3 mb-8 flex-wrap gap-2">
                  <span className="text-xs font-light text-muted-foreground uppercase tracking-[0.15em]">
                    Topics:
                  </span>
                  <Badge
                    variant={selectedTag === null ? "default" : "outline"}
                    className="font-light text-xs cursor-pointer"
                    onClick={() => setSelectedTag(null)}
                  >
                    All
                  </Badge>
                  {tags.slice(0, 6).map((tag) => (
                    <Badge
                      key={tag.name}
                      variant={selectedTag === tag.name ? "default" : "outline"}
                      className="font-light border-border/30 text-xs cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Posts Feed */}
              <div className="space-y-8">
                {loading ? (
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
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Failed to load posts: {error}</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <Card key={post.id} className="border-primary/20 bg-card/20 hover-lift">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.author?.image || ""} />
                              <AvatarFallback className="text-xs">
                                {post.author?.name?.[0] || post.author?.username?.[0] || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-light">{post.author?.name || post.author?.username}</p>
                              <p className="text-xs text-muted-foreground font-mono">@{post.author?.username}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        <CardDescription className="text-sm font-light text-foreground story-text leading-relaxed mb-3">
                          {post.content.length > 200 ? post.content.substring(0, 200) + '…' : post.content}
                        </CardDescription>

                        {post.codeSnippet && (
                          <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-auto max-h-32 mb-3">
                            <code>{post.codeSnippet.substring(0, 300)}{post.codeSnippet.length > 300 ? '…' : ''}</code>
                          </pre>
                        )}
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="font-light border-border/30 text-xs cursor-pointer"
                                onClick={() => setSelectedTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" className="font-light">
                              <Heart className="mr-2 h-3 w-3" />
                              {post._count?.likes || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="font-light">
                              <MessageCircle className="mr-2 h-3 w-3" />
                              {post._count?.comments || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="font-light">
                              <Share className="mr-2 h-3 w-3" />
                              Share
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="font-light">
                              <Bookmark className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No posts found. Try adjusting your search.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Trending Posts */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Trending Now</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {trendingPosts.map((post, index) => (
                      <div key={post.id} className="flex items-start space-x-3">
                        <span className="text-xs font-mono text-muted-foreground w-4 pt-1">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-light mb-1 line-clamp-2">
                            {post.content.substring(0, 80)}{post.content.length > 80 ? '…' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {post._count?.likes || 0} likes · {post._count?.comments || 0} comments
                          </p>
                        </div>
                      </div>
                    ))}
                    {trendingPosts.length === 0 && (
                      <p className="text-xs text-muted-foreground">No posts yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trending Topics */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Trending Topics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(tags.length > 0 ? tags : mockTrendingTopics.map(t => ({ name: t.name, count: t.count }))).slice(0, 6).map((topic, index) => (
                      <div
                        key={topic.name}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setSelectedTag(topic.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono text-muted-foreground w-4">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="text-sm font-light">#{topic.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {topic.count.toLocaleString()} posts
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Users */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Who to Follow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {suggestedUsers.map((user) => (
                      <div key={user.id} className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="text-xs">
                            {user.name?.[0] || user.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Link href={`/profile/${user.username}`}>
                              <p className="text-sm font-light truncate hover:text-primary transition-colors">
                                {user.name || user.username}
                              </p>
                            </Link>
                            <Button size="sm" variant="outline" className="font-light text-xs px-3">
                              Follow
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {suggestedUsers.length === 0 && (
                      <p className="text-xs text-muted-foreground">No suggestions yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Write CTA */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Share Your Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-light text-muted-foreground mb-4">
                    Have something valuable to share with the community?
                  </p>
                  <Button className="w-full font-light bg-foreground text-background" asChild>
                    <Link href="/home">
                      <Plus className="mr-2 h-4 w-4" />
                      Write a Post
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}