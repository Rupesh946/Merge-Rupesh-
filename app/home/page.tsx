"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/navbar";
import { useApi } from "@/hooks/use-api";
import { api, Post, User } from "@/lib/api";
import {
  Code2, Heart, MessageCircle, Share, ExternalLink,
  TrendingUp, Search, Plus, Settings, ArrowUp, X, Send, ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PostCard({
  post,
  onLike,
}: {
  post: Post;
  onLike: (id: string, liked: boolean) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localComments, setLocalComments] = useState<any[]>(post.comments || []);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await api.addPostComment(post.id, comment.trim());
      setLocalComments((prev) => [...prev, res.comment]);
      setComment("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-card/30 hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={post.author.image || ""} />
                <AvatarFallback className="text-xs">{post.author.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.author.username}`}>
                <p className="text-sm font-light hover:text-primary cursor-pointer transition-colors">
                  {post.author.name}
                </p>
              </Link>
              <p className="text-xs text-muted-foreground font-mono">@{post.author.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {post.codeLanguage && (
              <Badge variant="outline" className="font-light border-primary/40 text-primary text-xs uppercase tracking-[0.1em]">
                {post.codeLanguage}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-mono">{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        <p className="text-sm font-light leading-relaxed mb-3">{post.content}</p>

        {post.codeSnippet && (
          <pre className="bg-muted/40 border border-border/30 rounded-lg p-4 text-xs font-mono overflow-x-auto mb-3 text-foreground/80">
            <code>{post.codeSnippet}</code>
          </pre>
        )}

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post image"
            className="rounded-lg border border-border/20 w-full object-cover max-h-72 mb-3"
          />
        )}

        <div className="flex flex-wrap gap-1.5 mt-1">
          {post.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="font-light border-border/30 text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={`font-light gap-2 ${post.isLiked ? "text-red-500" : ""}`}
            onClick={() => onLike(post.id, !!post.isLiked)}
          >
            <Heart className={`h-3 w-3 ${post.isLiked ? "fill-current" : ""}`} />
            {post._count.likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="font-light gap-2"
            onClick={() => setShowComments((v) => !v)}
          >
            <MessageCircle className="h-3 w-3" />
            {post._count.comments}
          </Button>
          <Button variant="ghost" size="sm" className="font-light gap-2">
            <Share className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="font-light ml-auto" asChild>
            <Link href={`/posts/${post.id}`}>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
            {localComments.map((c) => (
              <div key={c.id} className="flex items-start space-x-2">
                <Avatar className="h-6 w-6 mt-0.5">
                  <AvatarImage src={c.author?.image || ""} />
                  <AvatarFallback className="text-xs">{c.author?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2">
                  <p className="text-xs font-light font-mono text-muted-foreground mb-1">
                    @{c.author?.username}
                  </p>
                  <p className="text-sm font-light">{c.content}</p>
                </div>
              </div>
            ))}
            <form onSubmit={handleComment} className="flex items-center space-x-2 mt-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                className="text-sm h-8 bg-muted/20 border-border/30"
              />
              <Button type="submit" size="sm" variant="ghost" disabled={submittingComment}>
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreatePostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Post) => void }) {
  const [content, setContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.createPost({
        content: content.trim(),
        codeSnippet: showCode && codeSnippet.trim() ? codeSnippet.trim() : undefined,
        codeLanguage: showCode && codeLanguage.trim() ? codeLanguage.trim() : undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      onCreated(res.post);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 border-primary/20 bg-card">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-light">Create Post</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a thought, snippet, or idea…"
              className="min-h-28 bg-muted/20 border-border/30 font-light resize-none"
              required
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-light gap-2"
              onClick={() => setShowCode((v) => !v)}
            >
              <Code2 className="h-3 w-3" />
              {showCode ? "Remove Code" : "Add Code Snippet"}
            </Button>
            {showCode && (
              <div className="space-y-2">
                <Input
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  placeholder="Language (e.g. TypeScript, Python)"
                  className="text-sm bg-muted/20 border-border/30"
                />
                <Textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste your code here…"
                  className="min-h-32 font-mono text-xs bg-muted/20 border-border/30 resize-none"
                />
              </div>
            )}
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated): react, typescript, webdev"
              className="text-sm bg-muted/20 border-border/30"
            />
            {error && <p className="text-sm text-red-500 font-light">{error}</p>}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="font-light">Cancel</Button>
              <Button type="submit" className="font-light" disabled={loading || !content.trim()}>
                {loading ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Initial feed load ──────────────────────────────────────────────────────
  const { data: feedData, error: feedError } = useApi(() => api.getFeed({ page: 1, limit: 15 }), []);
  const { data: tagsData, loading: tagsLoading } = useApi(() => api.getTrendingTags(), []);
  const { data: usersData, loading: usersLoading } = useApi(() => api.searchUsers("", 5), []);

  useEffect(() => {
    if (feedData?.posts) {
      setPosts(feedData.posts);
      setHasMore(feedData.posts.length === 15);
      setInitialLoading(false);
    } else if (feedError) {
      // If user is not following anyone, fallback to explore (public posts)
      api.getExplore({ type: "posts", page: 1, limit: 15 })
        .then((d) => {
          setPosts(d.posts || []);
          setHasMore((d.posts?.length || 0) === 15);
        })
        .catch(() => { })
        .finally(() => setInitialLoading(false));
    }
  }, [feedData, feedError]);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await api.getFeed({ page: nextPage, limit: 15 });
      if (res?.posts?.length) {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...res.posts.filter((p) => !ids.has(p.id))];
        });
        setHasMore(res.posts.length === 15);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  // ── Scroll handler ─────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset;
    setShowScrollTop(scrollTop > 400);
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 &&
      hasMore && !loadingMore && !initialLoading
    ) {
      loadMore();
    }
  }, [hasMore, loadingMore, initialLoading, loadMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // ── Like toggle ────────────────────────────────────────────────────────────
  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
            ...p,
            isLiked: !currentlyLiked,
            _count: { ...p._count, likes: currentlyLiked ? p._count.likes - 1 : p._count.likes + 1 },
          }
          : p
      )
    );
    try {
      if (currentlyLiked) await api.unlikePost(postId);
      else await api.likePost(postId);
    } catch {
      // Revert
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
              ...p,
              isLiked: currentlyLiked,
              _count: { ...p._count, likes: currentlyLiked ? p._count.likes + 1 : p._count.likes - 1 },
            }
            : p
        )
      );
    }
  };

  const handleFollow = async (username: string) => {
    try {
      await api.followUser(username);
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const trendingTags = tagsData?.tags || [];
  const suggestedUsers: User[] = usersData?.users || [];

  const filteredPosts = searchQuery
    ? posts.filter(
      (p) =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : posts;

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="home" />

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
        />
      )}

      <div className="pt-20 px-8">
        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* ── Main Feed ─────────────────────────────────────────────── */}
            <div className="lg:col-span-8">
              {/* Search + create post */}
              <div className="mb-8 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    placeholder="Search your feed…"
                    className="pl-12 bg-muted/30 border-primary/20 font-light focus:border-primary/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  className="font-light gap-2 shrink-0"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="h-3 w-3" />
                  New Post
                </Button>
              </div>

              {/* Posts */}
              <div className="space-y-8">
                {initialLoading ? (
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
                        <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                      </CardHeader>
                    </Card>
                  ))
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-24">
                    <Code2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-light text-lg mb-2">Your feed is empty</p>
                    <p className="text-muted-foreground font-light text-sm mb-6">
                      Follow developers or create your first post!
                    </p>
                    <Button className="font-light gap-2" onClick={() => setShowCreatePost(true)}>
                      <Plus className="h-4 w-4" />
                      Create a Post
                    </Button>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} onLike={handleLike} />
                  ))
                )}

                {loadingMore && (
                  <div className="flex justify-center py-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      <span className="text-sm font-light">Loading more…</span>
                    </div>
                  </div>
                )}

                {!hasMore && filteredPosts.length > 0 && (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <div className="w-12 h-px bg-border mb-3" />
                    <p className="text-sm font-light">You're all caught up</p>
                    <p className="text-xs font-mono mt-1">{filteredPosts.length} posts loaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-8">
              {/* Trending Tags */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Trending</span>
                  </CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  {tagsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : trendingTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-light">No tags yet — start posting!</p>
                  ) : (
                    <div className="space-y-3">
                      {trendingTags.slice(0, 10).map((tag, i) => (
                        <div key={tag.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-mono text-muted-foreground w-4">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <Badge variant="outline" className="font-light border-border/30 text-xs">
                              #{tag.name}
                            </Badge>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{tag.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Who to Follow */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Who to Follow</CardTitle>
                </CardHeader>
                <div className="px-6 pb-6 space-y-5">
                  {usersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    ))
                  ) : suggestedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-light">No users found yet.</p>
                  ) : (
                    suggestedUsers.map((user) => (
                      <div key={user.id} className="flex items-start space-x-3">
                        <Link href={`/profile/${user.username}`}>
                          <Avatar className="h-9 w-9 cursor-pointer">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <Link href={`/profile/${user.username}`}>
                              <p className="text-sm font-light truncate hover:text-primary transition-colors cursor-pointer">
                                {user.name}
                              </p>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="font-light text-xs px-3 shrink-0 ml-2"
                              onClick={() => handleFollow(user.username)}
                            >
                              Follow
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>
                          )}
                          {user._count && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {user._count.followers} followers
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <Button variant="ghost" size="sm" className="w-full font-light text-muted-foreground gap-1" asChild>
                    <Link href="/explore">
                      <ChevronDown className="h-3 w-3" />
                      Explore more developers
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Quick Actions</CardTitle>
                </CardHeader>
                <div className="px-6 pb-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start font-light"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    New Post
                  </Button>
                  <Button variant="outline" className="w-full justify-start font-light" asChild>
                    <Link href="/projects">
                      <Code2 className="mr-3 h-4 w-4" />
                      Browse Projects
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start font-light" asChild>
                    <Link href="/settings">
                      <Settings className="mr-3 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}