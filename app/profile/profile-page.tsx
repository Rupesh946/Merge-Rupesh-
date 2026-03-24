"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import {
  Code2,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Star,
  GitFork,
  ExternalLink,
  Github,
  Settings,
  MessageCircle,
  Heart,
  Plus,
  LogOut,
  Users,
  UserPlus,
  UserMinus,
  Activity,
  FileText,
  GitBranch,
  MessageSquare,
  Clock,
  Image as ImageIcon,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

// Define types for the data we'll be fetching
interface Project {
  id: string;
  name: string;
  description: string;
  stars?: number;
  forks?: number;
  language?: string;
  updatedAt?: string;
  featured?: boolean;
  tags?: string[];
}

interface Insight {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  likes: number;
  comments: number;
  tags: string[];
  content?: string;
  author?: any;
  _count?: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

interface Activity {
  id: string;
  type: string;
  action: string;
  target: string;
  timeAgo: string;
}

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [githubStats, setGithubStats] = useState({
    publicRepos: 0,
    publicGists: 0,
    followers: 0,
    following: 0,
    contributions: 0,
    stars: 0,
    totalForks: 0,
  });
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [githubStatsLoading, setGithubStatsLoading] = useState(true);

  const handleLogout = () => {
    logout();
    router.push("/auth/signin"); // Redirect to signin page after logout
  };

  // Fetch user projects, insights, and activity
  useEffect(() => {
    const fetchUserData = async () => {
      if (!loading && user) {
        try {
          // Fetch projects for the profile being viewed
          // If on own profile, use current user's username
          // If on another user's profile, we need to determine that
          const profileUsername = user.username; // For now, we're only handling own profile
          setProjectsLoading(true);
          const projectsResponse = await api.getProjects({ limit: 10, author: profileUsername } as any);
          setProjects(projectsResponse.projects || []);

          // Fetch user posts (insights tab uses posts)
          setInsightsLoading(true);
          const postsResponse = await api.getPosts({ limit: 20 });
          const userPosts = (postsResponse.posts || []).filter(
            (p) => p.author?.username === profileUsername
          );
          // Transform Post to Insight format
          const transformedInsights = userPosts.map((post) => ({
            id: post.id,
            title: post.content.substring(0, 80) + (post.content.length > 80 ? '…' : ''),
            excerpt: post.content,
            publishedAt: new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            readTime: '',
            likes: post._count?.likes || 0,
            comments: post._count?.comments || 0,
            tags: post.tags || [],
            content: post.content,
            author: post.author,
            _count: post._count,
            isLiked: post.isLiked,
          }));
          setInsights(transformedInsights);

          // Fetch user activity
          setActivityLoading(true);
          const activityResponse = await api.getNotifications({ page: 1 });
          // Transform notifications to activity format
          const activityData = (activityResponse.notifications || []).map(
            (notification) => ({
              id: notification.id,
              type: notification.type || "notification",
              action: notification.message || notification.title || "Activity",
              target: notification.targetId || notification.id || "N/A",
              timeAgo: notification.createdAt || "Just now",
            }),
          );
          setActivity(activityData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setProjects([]);
          setInsights([]);
          setActivity([]);
        } finally {
          setProjectsLoading(false);
          setInsightsLoading(false);
          setActivityLoading(false);
        }
      }
    };

    fetchUserData();

    // Fetch GitHub stats if user has githubUsername
    if (!loading && user && user.githubUsername) {
      const fetchGithubStats = async () => {
        try {
          setGithubStatsLoading(true);
          const stats = await api.getGitHubStats(user.githubUsername!);
          setGithubStats({
            publicRepos: stats.publicRepos,
            publicGists: 0, // Default value
            followers: stats.followers,
            following: stats.following,
            contributions: stats.contributions,
            stars: stats.stars,
            totalForks: stats.totalForks,
          });
        } catch (error) {
          console.error("Error fetching GitHub stats:", error);
          setGithubStats({
            publicRepos: 0,
            publicGists: 0,
            followers: 0,
            following: 0,
            contributions: 0,
            stars: 0,
            totalForks: 0,
          });
        } finally {
          setGithubStatsLoading(false);
        }
      };

      fetchGithubStats();
    } else {
      setGithubStatsLoading(false);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar currentPage="profile" />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default values for when user data is not available
  const profileData = {
    name: user?.name || "User",
    username: user?.username || "username",
    bio: user?.bio || "No bio available",
    location: user?.location || "",
    website: user?.website || "",
    avatar: user?.image || "/api/placeholder/120/120",
    githubStats: {
      publicRepos: githubStats.publicRepos,
      publicGists: githubStats.publicGists,
      followers: user?._count?.followers || 0,
      following: user?._count?.following || 0,
      contributions: githubStats.contributions,
      stars: githubStats.stars,
      totalForks: githubStats.totalForks,
    },
    skills: [], // This would come from user profile or be added as a feature
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
    : "Unknown";

  // Calculate total stats
  const totalProjects = user?._count?.projects || 0;
  const totalStars = projects.reduce(
    (sum, project) => sum + (project.stars || 0),
    0,
  );
  const totalForks = projects.reduce(
    (sum, project) => sum + (project.forks || 0),
    0,
  );
  const totalFeatured = projects.filter((p) => p.featured).length;

  const totalPosts = insights.length;
  const totalLikes = insights.reduce((sum, insight) => sum + insight.likes, 0);
  const totalComments = insights.reduce(
    (sum, insight) => sum + insight.comments,
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar currentPage="profile" />

      {/* Profile Hero Banner */}
      <div className="relative pt-20 overflow-hidden">
        <div className="absolute inset-0"></div>
        <div className="absolute inset-0"></div>

        <div className="relative max-w-6xl mx-auto px-4">
          {/* Profile Card */}
          <div className=" border border-border/50 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-1 rounded-2xl">
              <div className="bg-card rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar Section */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-primary/20 bg-background">
                        <AvatarImage
                          src={profileData.avatar}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-2xl font-light bg-primary/5">
                          {profileData.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                          {profileData.name}
                        </h1>
                        <p className="text-lg text-muted-foreground font-mono">
                          @{profileData.username}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          asChild
                        >
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="mt-3 text-foreground/80 story-text">
                      {profileData.bio}
                    </p>

                    {/* Profile Details */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {profileData.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profileData.location}</span>
                        </div>
                      )}
                      {profileData.website && (
                        <div className="flex items-center space-x-1">
                          <LinkIcon className="h-4 w-4" />
                          <a
                            href={profileData.website}
                            className="hover:text-foreground transition-colors hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {profileData.website.replace("https://", "")}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {joinedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Bar - Integrated GitHub and Social Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4 border-t border-border/30 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {totalProjects}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Projects
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {totalStars.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Stars
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {githubStatsLoading ? '-' : (profileData.githubStats.publicRepos || '-')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Repos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {githubStatsLoading ? '-' : (profileData.githubStats.contributions?.toLocaleString() || '-')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Contribs
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {profileData.githubStats.followers.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {profileData.githubStats.following.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Following
                    </div>
                  </div>
                </div>

                {/* GitHub Link */}
                <div className="mt-4 text-center">
                  <a
                    href={`https://github.com/${user?.githubUsername || user?.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  >
                    View GitHub Profile
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="posts" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 h-auto p-1 bg-muted/50">
              <TabsTrigger
                value="posts"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Code2 className="mr-2 h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                <FileText className="mr-2 h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                <Activity className="mr-2 h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="rounded-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* ── POSTS TAB ── */}
          <TabsContent value="posts" className="space-y-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">My Posts</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{totalPosts} posts shared</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl p-3 bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/20 text-center">
                <p className="text-xl font-bold text-pink-600">{totalLikes}</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-violet-500/10 to-violet-600/10 border border-violet-500/20 text-center">
                <p className="text-xl font-bold text-violet-600">{totalComments}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-center">
                <p className="text-xl font-bold text-blue-600">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>

            {/* Posts list */}
            {insightsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/20 bg-card p-4 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-28" />
                        <div className="h-2.5 bg-muted rounded w-16" />
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded w-full mb-1.5" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : insights.length === 0 ? (
              <div className="rounded-2xl border border-border/20 bg-card py-16 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold mb-1">No posts yet</p>
                <p className="text-sm text-muted-foreground">Share your thoughts with the community!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-border/20 bg-card overflow-hidden hover:border-border/40 transition-colors">
                    {/* Post header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={user?.image || ""} />
                        <AvatarFallback className="text-xs font-semibold">
                          {user?.name?.[0] || user?.username?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-none">{user?.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          @{user?.username}
                          <span className="text-muted-foreground/40">·</span>
                          <Clock className="h-2.5 w-2.5" />
                          {post.publishedAt}
                        </p>
                      </div>
                    </div>

                    {/* Post content */}
                    <div className="px-4 pb-3">
                      <p className="text-sm text-foreground/90 leading-relaxed">{post.excerpt}</p>
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {post.tags.slice(0, 5).map((tag) => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-1 px-3 py-2 border-t border-border/10">
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-red-400 text-xs">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-xs">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </button>
                      <div className="flex-1" />
                      <button className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                        <Bookmark className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Projects</h2>
              <Button variant="outline" className="rounded-full">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalProjects}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Projects
                    </p>
                  </div>
                  <Code2 className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {totalStars.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Stars</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {totalForks}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Forks</p>
                  </div>
                  <GitFork className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {totalFeatured}
                    </p>
                    <p className="text-sm text-muted-foreground">Featured</p>
                  </div>
                  <Star className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Fetch and display actual user projects from the API */}
              {projectsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card
                    key={i}
                    className="border-border/20 bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="h-4 w-full bg-muted rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-2/3 bg-muted rounded animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 bg-muted rounded-full animate-pulse"></div>
                            <div className="h-3 w-8 bg-muted rounded animate-pulse"></div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 bg-muted rounded-full animate-pulse"></div>
                            <div className="h-3 w-8 bg-muted rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <Card
                    key={project.id}
                    className="border-border/20 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-md"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Code2 className="h-4 w-4 text-primary" />
                          <CardTitle className="text-lg font-medium truncate max-w-[160px]">
                            {project.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-1">
                          {project.featured && (
                            <Badge variant="secondary" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-sm text-muted-foreground story-text line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{project.stars?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitFork className="h-3 w-3" />
                            <span>{project.forks || 0}</span>
                          </div>
                          {project.language && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span>{project.language}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Updated {project.updatedAt || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(project.tags || []).slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs px-2 py-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {project.tags && project.tags.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1"
                          >
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Code2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Get started by sharing your first project.
                  </p>
                  <Button className="mt-4 rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Share Project
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Insights</h2>
              <Button variant="outline" className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Write New
              </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalPosts}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-pink-600">
                      {totalLikes}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Likes</p>
                  </div>
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {totalComments}
                    </p>
                    <p className="text-sm text-muted-foreground">Comments</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {insights.filter((i) => i.publishedAt).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                  <ExternalLink className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Fetch and display actual user blog posts from the API */}
              {insightsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-border/20 bg-card/50">
                    <CardHeader className="pb-4">
                      <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-full bg-muted rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-2/3 bg-muted rounded animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-12 bg-muted rounded animate-pulse"></div>
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 bg-muted rounded-full animate-pulse"></div>
                            <div className="h-3 w-6 bg-muted rounded animate-pulse"></div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 bg-muted rounded-full animate-pulse"></div>
                            <div className="h-3 w-6 bg-muted rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <div className="h-5 w-12 bg-muted rounded animate-pulse"></div>
                        <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : insights.length > 0 ? (
                insights.map((insight) => (
                  <Card
                    key={insight.id}
                    className="border-border/20 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-md"
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold hover:text-primary transition-colors cursor-pointer">
                        {insight.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground story-text line-clamp-2">
                        {insight.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{insight.publishedAt}</span>
                          <span>{insight.readTime}</span>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{insight.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{insight.comments}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insight.tags.slice(0, 4).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {insight.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{insight.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No insights yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Write your first blog post to share your knowledge.
                  </p>
                  <Button className="mt-4 rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Write Insight
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>

            <Card className="border-border/20 bg-card/50">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Fetch and display actual user activity from the API */}
                  {activityLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="h-2 w-2 bg-muted rounded-full mt-2 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-3 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
                          <div className="h-2 w-1/4 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))
                  ) : activity.length > 0 ? (
                    activity.map((activityItem) => (
                      <div
                        key={activityItem.id}
                        className="flex items-start space-x-3 hover:bg-muted/30 p-2 rounded-lg transition-colors"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="text-foreground font-medium">
                              {activityItem.action}
                            </span>
                            {activityItem.target && (
                              <span className="text-primary font-medium mx-2">
                                {activityItem.target}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {activityItem.timeAgo}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">
                        No recent activity
                      </h3>
                      <p className="mt-2 text-muted-foreground">
                        Your activity will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  );
}
