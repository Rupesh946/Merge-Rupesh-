// This is the dynamic route page for user profiles: /profile/[username]
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  X
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
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

// Define interface for user data
interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  githubUsername?: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const { username } = useParams(); // Get the username from the URL
  const { user: currentUser, isAuthenticated } = useAuth(); // Current logged-in user
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<User | null>(null);
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
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) {
        router.push('/404');
        return;
      }

      try {
        setLoading(true);

        // Handle username parameter (can be string or array)
        const profileUsername = Array.isArray(username) ? username[0] : username;

        if (!profileUsername) {
          router.push('/404');
          return;
        }

        console.log("Fetching user profile for:", profileUsername); // Add debug log

        // Fetch user profile by username
        const userResponse = await api.getUser(profileUsername);
        console.log("User response:", userResponse); // Add debug log

        // Note: The API response format is just the user object
        const userObject = userResponse;
        setUserProfile(userObject);

        // Fetch user projects
        setProjectsLoading(true);
        const projectsResponse = await api.getProjects({ limit: 10, author: profileUsername });
        setProjects(projectsResponse.projects || []);

        // Fetch user insights/blogs
        setInsightsLoading(true);
        const insightsResponse = await api.getBlogPosts({ limit: 10, author: profileUsername });
        // Transform BlogPost to Insight
        const transformedInsights = (insightsResponse.posts || []).map(
          (post) => ({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt || post.content.substring(0, 100) + "...",
            publishedAt: post.createdAt,
            readTime: post.readTime ? `${post.readTime} min read` : "N/A",
            likes: post._count?.likes || 0,
            comments: post._count?.comments || 0,
            tags: post.tags || [],
            content: post.content,
            author: post.author,
            _count: post._count,
            isLiked: post.isLiked,
          }),
        );
        setInsights(transformedInsights);

        // For activity, we'll fetch notifications that might be relevant
        setActivityLoading(true);
        // Placeholder for activity - in a real implementation you'd fetch user activity
        setActivity([]);

        // Fetch GitHub stats if user has githubUsername
        if (userObject.githubUsername) {
          setGithubStatsLoading(true);
          const stats = await api.getGitHubStats(userObject.githubUsername);
          setGithubStats({
            publicRepos: stats.publicRepos,
            publicGists: 0, // Default or fetch if available
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
      } else {
        setGithubStatsLoading(false);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      // Check if it's a 404 error specifically
      if (error.message && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
        // Show user not found page instead of generic 404
        router.push('/404');
      } else {
        // For other errors, you might want to show a different error page
        router.push('/404');
      }
    } finally {
      setLoading(false);
      setProjectsLoading(false);
      setInsightsLoading(false);
      setActivityLoading(false);
    }
  };

  fetchUserProfile();
}, [username, router]);

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

if (!userProfile) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="profile" />
      <div className="pt-20 px-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold">User not found</h1>
          <p className="text-muted-foreground mt-2">The requested user profile does not exist.</p>
        </div>
      </div>
    </div>
  );
}

// Calculate total stats
const totalProjects = projects.length;
const totalStars = projects.reduce((sum, project) => sum + (project.stars || 0), 0);
const totalForks = projects.reduce((sum, project) => sum + (project.forks || 0), 0);
const totalFeatured = projects.filter((p) => p.featured).length;

const totalPosts = insights.length;
const totalLikes = insights.reduce((sum, insight) => sum + insight.likes, 0);
const totalComments = insights.reduce((sum, insight) => sum + insight.comments, 0);

const joinedDate = userProfile.createdAt
  ? new Date(userProfile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })
  : "Unknown";

return (
  <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
    <Navbar currentPage="profile" />

    {/* Profile Hero Banner */}
    <div className="relative pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Profile Card */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl">
            <div className="bg-card rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary/20 bg-background">
                      <AvatarImage src={userProfile.image || "/api/placeholder/120/120"} className="object-cover" />
                      <AvatarFallback className="text-2xl font-light bg-primary/5">
                        {userProfile.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                        {userProfile.name}
                      </h1>
                      <p className="text-lg text-muted-foreground font-mono">
                        @{userProfile.username}
                      </p>
                    </div>

                    {/* Action Buttons - shown only for other users, not current user */}
                    {isAuthenticated && currentUser?.username !== userProfile.username && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-full">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                        <Button variant="default" size="sm" className="rounded-full">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Follow
                        </Button>
                      </div>
                    )}

                    {/* Own profile actions */}
                    {isAuthenticated && currentUser?.username === userProfile.username && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-full">
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="mt-3 text-foreground/80 story-text">
                    {userProfile.bio || "No bio available"}
                  </p>

                  {/* Profile Details */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {userProfile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{userProfile.location}</span>
                      </div>
                    )}
                    {userProfile.website && (
                      <div className="flex items-center space-x-1">
                        <LinkIcon className="h-4 w-4" />
                        <a
                          href={userProfile.website}
                          className="hover:text-foreground transition-colors hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {userProfile.website.replace('https://', '')}
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

              {/* Stats Bar */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t border-border/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalProjects}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{totalStars.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Stars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{githubStats.publicRepos}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Repos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{githubStats.contributions?.toLocaleString() || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Contribs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{githubStats.followers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{githubStats.following.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Following</div>
                </div>
              </div>

              {/* GitHub Link */}
              <div className="mt-4 text-center pt-4 border-t border-border/30">
                <a
                  href={`https://github.com/${userProfile.githubUsername || userProfile.username}`}
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
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 h-auto p-1 bg-muted/50">
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

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Projects</h2>
            {isAuthenticated && currentUser?.username === userProfile.username && (
              <Button variant="outline" className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Share Project
              </Button>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalProjects}</p>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </div>
                <Code2 className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{totalStars.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Stars</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{totalForks}</p>
                  <p className="text-sm text-muted-foreground">Total Forks</p>
                </div>
                <GitFork className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{totalFeatured}</p>
                  <p className="text-sm text-muted-foreground">Featured</p>
                </div>
                <Star className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fetch and display projects for this user */}
            {projectsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/20 bg-card/50 hover:bg-card/80 transition-colors">
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
                        <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags && project.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
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
                  {userProfile.username === currentUser?.username
                    ? "Get started by sharing your first project."
                    : `${userProfile.name} hasn't shared any projects yet.`
                  }
                </p>
                {isAuthenticated && userProfile.username === currentUser?.username && (
                  <Button className="mt-4 rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Share Project
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Insights</h2>
            {isAuthenticated && currentUser?.username === userProfile.username && (
              <Button variant="outline" className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Write New
              </Button>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalPosts}</p>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-pink-600">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{totalComments}</p>
                  <p className="text-sm text-muted-foreground">Comments</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{insights.filter(i => i.publishedAt).length}</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
                <ExternalLink className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Fetch and display blog posts for this user */}
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
                        <Badge key={tag} variant="outline" className="text-xs">
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
                  {userProfile.username === currentUser?.username
                    ? "Write your first blog post to share your knowledge."
                    : `${userProfile.name} hasn't published any insights yet.`
                  }
                </p>
                {isAuthenticated && userProfile.username === currentUser?.username && (
                  <Button className="mt-4 rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Write Insight
                  </Button>
                )}
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
                    <h3 className="mt-4 text-lg font-medium">No recent activity</h3>
                    <p className="mt-2 text-muted-foreground">
                      {userProfile.username === currentUser?.username
                        ? "Your activity will appear here."
                        : `${userProfile.name} hasn't been active recently.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
);
}