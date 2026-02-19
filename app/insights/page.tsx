"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { useApi } from "@/hooks/use-api";
import { api, BlogPost, User } from "@/lib/api";
import {
  Heart,
  MessageCircle,
  Share,
  ExternalLink,
  TrendingUp,
  Search,
  Plus,
  Filter,
  Clock,
  Eye,
  Bookmark,
  X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock trending data (to be replaced with real API calls)
const mockTrendingTopics = [
  { name: "AI Development", count: 1247, trend: "up" },
  { name: "Rust", count: 892, trend: "up" },
  { name: "WebGL", count: 756, trend: "stable" },
  { name: "Design Systems", count: 634, trend: "up" },
  { name: "Performance", count: 523, trend: "stable" },
  { name: "Clean Code", count: 445, trend: "down" }
];

const mockFeaturedAuthors = [
  {
    name: "Maya Patel",
    username: "maya_writes",
    bio: "Senior Engineer at Vercel, writing about web performance",
    followers: 3421,
    image: "/api/placeholder/40/40",
    verified: true
  },
  {
    name: "Casey Morgan",
    username: "systems_thinker",
    bio: "Design systems architect, previously at Figma",
    followers: 2876,
    image: "/api/placeholder/40/40",
    verified: true
  },
  {
    name: "River Chen",
    username: "rust_evangelist",
    bio: "Core contributor to Rust, systems programming enthusiast",
    followers: 4123,
    image: "/api/placeholder/40/40",
    verified: true
  }
];

export default function InsightsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<'all' | 'articles' | 'tutorials' | 'news' | 'discussions'>('all');

  const { data: insightsData, loading, error } = useApi(
    () => api.getBlogPosts({
      limit: 10,
      search: searchQuery,
      type: contentType === 'all' ? undefined : contentType,
      sort: 'trending'
    }),
    [searchQuery, contentType]
  );

  const { data: trendingBlogsData } = useApi(
    () => api.getBlogPosts({ limit: 5, type: 'trending' }),
    []
  );

  const { data: topDiscussionsData } = useApi(
    () => api.getBlogPosts({ limit: 5, sort: 'comments' }),
    []
  );

  const insights = insightsData?.posts || [];
  const trendingBlogs = trendingBlogsData?.posts || [];
  const topDiscussions = topDiscussionsData?.posts || [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleContentTypeChange = (type: 'all' | 'articles' | 'tutorials' | 'news' | 'discussions') => {
    setContentType(type);
  };

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
                    <Button size="sm" className="font-light bg-foreground text-background">
                      <Plus className="mr-2 h-3 w-3" />
                      Write Insight
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    placeholder="Search insights, topics, authors..."
                    className="pl-12 bg-muted/30 border-primary/20 font-light focus:border-primary/40"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>

                {/* Content Type Tabs */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <Button
                    variant={contentType === 'all' ? 'secondary' : 'ghost'}
                    className={`font-light ${contentType === 'all' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => handleContentTypeChange('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={contentType === 'articles' ? 'secondary' : 'ghost'}
                    className={`font-light ${contentType === 'articles' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => handleContentTypeChange('articles')}
                  >
                    Articles
                  </Button>
                  <Button
                    variant={contentType === 'tutorials' ? 'secondary' : 'ghost'}
                    className={`font-light ${contentType === 'tutorials' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => handleContentTypeChange('tutorials')}
                  >
                    Tutorials
                  </Button>
                  <Button
                    variant={contentType === 'news' ? 'secondary' : 'ghost'}
                    className={`font-light ${contentType === 'news' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => handleContentTypeChange('news')}
                  >
                    News
                  </Button>
                  <Button
                    variant={contentType === 'discussions' ? 'secondary' : 'ghost'}
                    className={`font-light ${contentType === 'discussions' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => handleContentTypeChange('discussions')}
                  >
                    Discussions
                  </Button>
                </div>

                {/* Filter Tags */}
                <div className="flex items-center space-x-3 mb-8">
                  <span className="text-xs font-light text-muted-foreground uppercase tracking-[0.15em]">
                    Topics:
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-light border-primary/30 bg-primary/10 text-xs cursor-pointer">
                      All
                    </Badge>
                    <Badge variant="outline" className="font-light border-border/30 text-xs cursor-pointer hover:bg-muted/50">
                      AI Development
                    </Badge>
                    <Badge variant="outline" className="font-light border-border/30 text-xs cursor-pointer hover:bg-muted/50">
                      Performance
                    </Badge>
                    <Badge variant="outline" className="font-light border-border/30 text-xs cursor-pointer hover:bg-muted/50">
                      Design Systems
                    </Badge>
                    <Badge variant="outline" className="font-light border-border/30 text-xs cursor-pointer hover:bg-muted/50">
                      News
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Insights Feed */}
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
                    <p className="text-muted-foreground">Failed to load insights: {error}</p>
                  </div>
                ) : insights.length > 0 ? (
                  insights.map((insight) => (
                    <Card key={insight.id} className="border-primary/20 bg-card/20 hover-lift">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={insight.author?.image || "/api/placeholder/40/40"} />
                              <AvatarFallback className="text-xs">{insight.author?.name[0] || insight.author?.username[0] || "A"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-light">{insight.author?.name || insight.author?.username}</p>
                              <p className="text-xs text-muted-foreground font-mono">@{insight.author?.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {insight.published && (
                              <Badge variant="outline" className="font-light border-primary/40 text-primary text-xs uppercase tracking-[0.1em]">
                                Published
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(insight.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        <CardTitle className="text-xl font-light mb-3 hover:text-primary cursor-pointer transition-colors leading-tight">
                          <Link href={`/insights/${insight.id}`}>
                            {insight.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-sm font-light text-muted-foreground story-text leading-relaxed">
                          {insight.excerpt || insight.content.substring(0, 150) + '...'}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-2">
                            {insight.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="font-light border-border/30 text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {insight.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{insight.tags.length - 3}</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground font-mono">
                            {insight.readTime && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{insight.readTime} min read</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{insight._count?.views || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm" className="font-light">
                              <Heart className="mr-2 h-3 w-3" />
                              {insight._count?.likes || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="font-light">
                              <MessageCircle className="mr-2 h-3 w-3" />
                              {insight._count?.comments || 0}
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
                            <Button variant="ghost" size="sm" className="font-light">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No insights found. Try adjusting your search.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Focus on Discovery */}
            <div className="lg:col-span-4 space-y-8">
              {/* Trending Insights */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Trending Now</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {trendingBlogs.map((blog, index) => (
                      <div key={blog.id} className="flex items-start space-x-3">
                        <span className="text-xs font-mono text-muted-foreground w-4 pt-1">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <Link href={`/insights/${blog.id}`} className="block">
                            <p className="text-sm font-light hover:text-primary transition-colors mb-1 line-clamp-2">
                              {blog.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {blog._count?.likes || 0} likes • {blog._count?.comments || 0} comments
                            </p>
                          </Link>
                        </div>
                      </div>
                    ))}
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
                    {mockTrendingTopics.map((topic, index) => (
                      <div key={topic.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono text-muted-foreground w-4">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="text-sm font-light">{topic.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {topic.count.toLocaleString()} insights
                            </p>
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${topic.trend === 'up' ? 'text-green-500 bg-green-500/10' :
                          topic.trend === 'down' ? 'text-red-500 bg-red-500/10' :
                            'text-muted-foreground bg-muted/20'
                          }`}>
                          {topic.trend === 'up' ? '↗' : topic.trend === 'down' ? '↘' : '→'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Hot Discussions */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span>Hot Discussions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topDiscussions.map((post, index) => (
                      <div key={post.id} className="flex items-start space-x-3">
                        <span className="text-xs font-mono text-muted-foreground w-4 pt-1">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <Link href={`/insights/${post.id}`} className="block">
                            <p className="text-sm font-light hover:text-primary transition-colors mb-1 line-clamp-2">
                              {post.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {post._count?.comments || 0} comments • {post._count?.likes || 0} likes
                            </p>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Popular Authors */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Popular Authors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockFeaturedAuthors.map((author) => (
                      <div key={author.username} className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={author.image} />
                          <AvatarFallback className="text-xs">{author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-light truncate">{author.name}</p>
                              {author.verified && (
                                <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                                  <div className="w-1 h-1 bg-primary-foreground rounded-full"></div>
                                </div>
                              )}
                            </div>
                            <Button size="sm" variant="outline" className="font-light text-xs px-3">
                              Follow
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">@{author.username}</p>
                          <p className="text-xs text-muted-foreground mb-2">{author.bio}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {author.followers.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Write Your Own */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Share Your Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-light text-muted-foreground mb-4">
                    Have something valuable to share with the community?
                  </p>
                  <Button className="w-full font-light bg-foreground text-background" asChild>
                    <Link href="/insights/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Write an Insight
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