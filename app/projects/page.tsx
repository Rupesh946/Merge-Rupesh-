"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { useApi } from "@/hooks/use-api";
import { api, Project } from "@/lib/api";
import { useGitHubProjects } from "@/hooks/use-github-projects";
import {
  Code2,
  Star,
  GitFork,
  ExternalLink,
  Search,
  Plus,
  TrendingUp,
  MessageCircle,
  Github,
  Play,
  Heart,
  GitBranch,
  X
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGitHubProjects, setShowGitHubProjects] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [githubCurrentPage, setGithubCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Share project modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [projectTags, setProjectTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Repo picker state
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  const { data: projectsData, loading, error, setData } = useApi(
    () => api.getProjects({
      limit: itemsPerPage,
      page: currentPage,
      search: searchQuery,
    }),
    [searchQuery, showGitHubProjects, currentPage]
  );

  const projects = projectsData?.projects || [];
  const totalProjects = projectsData?.pagination?.total || 0;
  const totalPages = Math.ceil(totalProjects / itemsPerPage) || 1;

  // GitHub projects hook
  const {
    projects: githubProjects,
    loading: githubLoading,
    error: githubError,
    fetchProjects: fetchGitHubProjects
  } = useGitHubProjects();

  // Load GitHub projects when showGitHubProjects is true
  useEffect(() => {
    if (showGitHubProjects) {
      fetchGitHubProjects(
        itemsPerPage,
        searchQuery,
        githubCurrentPage
      );
    }
  }, [showGitHubProjects, searchQuery, githubCurrentPage, fetchGitHubProjects]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLikeProject = async (projectId: string) => {
    try {
      // Optimistic update
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          projects: prevData.projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                isLiked: !p.isLiked,
                _count: {
                  ...p._count,
                  likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1,
                },
              };
            }
            return p;
          }),
        };
      });
      await api.likeProject(projectId);
    } catch (err) {
      console.error("Failed to like project:", err);
      // Revert on error
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          projects: prevData.projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                isLiked: !p.isLiked,
                _count: {
                  ...p._count,
                  likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1,
                },
              };
            }
            return p;
          }),
        };
      });
    }
  };

  // Function to fetch user's GitHub repositories
  const fetchUserRepos = async () => {
    try {
      setLoadingRepos(true);

      // First check if the user is logged in with a main auth token
      const authToken = typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

      if (!authToken) {
        setSubmitError("You need to be logged in first.");
        setLoadingRepos(false);
        return;
      }

      // Check if there's a GitHub token stored specifically for GitHub API calls
      const githubToken = typeof window !== 'undefined'
        ? localStorage.getItem('github_token')
        : null;

      // If no separate GitHub token, the user may need to link their GitHub account
      // via the backend API that manages the tokens
      if (!githubToken) {
        // Try to access the GitHub API directly with just the auth token
        // This might work if the backend manages the GitHub token internally
        // For now, let's provide a suggestion to the user
        setSubmitError("GitHub account not linked. Please connect your GitHub account first.");
        setLoadingRepos(false);
        return;
      }

      // Fetch user's repositories from GitHub API
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setSubmitError("Invalid GitHub token. Please reconnect your GitHub account.");
          setLoadingRepos(false);
          return;
        } else {
          throw new Error(`Failed to fetch repositories: ${response.status} ${response.statusText}`);
        }
      }

      const repos = await response.json();
      setUserRepos(repos);
      setShowRepoPicker(true);
      setSubmitError(null);
    } catch (error) {
      console.error("Error fetching user repositories:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to fetch repositories. Please check your GitHub connection.");
    } finally {
      setLoadingRepos(false);
    }
  };


  // Function to select a repository
  const selectRepo = (repo: any) => {
    setProjectName(repo.name);
    setProjectDescription(repo.description || "");
    setGithubUrl(repo.html_url);
    
    // Set language as a tag if available
    if (repo.language) {
      setProjectTags(prev => {
        const tags = prev ? prev.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        if (!tags.includes(repo.language) && repo.language) {
          tags.push(repo.language);
        }
        return tags.join(', ');
      });
    }
    
    setShowRepoPicker(false);
    setSubmitError(null);
  };

  // Function to import repository by URL
  const importRepo = async () => {
    if (!repoUrl) {
      setSubmitError("Please enter a GitHub repository URL");
      return;
    }

    try {
      setSubmitError(null);
      
      // Extract owner and repo name from URL
      let owner, repo;
      if (repoUrl.includes('github.com/')) {
        const urlParts = repoUrl.split('/');
        owner = urlParts[urlParts.indexOf('github.com') + 1];
        repo = urlParts[urlParts.indexOf('github.com') + 2];
      } else {
        const [o, r] = repoUrl.split('/');
        owner = o;
        repo = r;
      }

      if (!owner || !repo) {
        throw new Error("Invalid GitHub repository URL format. Please use format: https://github.com/owner/repo or owner/repo");
      }

      // Fetch repository details from GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Repository not found. Please check the URL and try again.");
        } else {
          throw new Error(`Failed to fetch repository: ${response.status} ${response.statusText}`);
        }
      }
      
      const repoData = await response.json();
      
      // Extract relevant information
      setProjectName(repoData.name || "");
      setProjectDescription(repoData.description || "");
      setGithubUrl(repoData.html_url || repoUrl);
      
      // Add language as a tag if available
      if (repoData.language) {
        setProjectTags(prev => {
          const tags = prev ? prev.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
          if (!tags.includes(repoData.language) && repoData.language) {
            tags.push(repoData.language);
          }
          return tags.join(', ');
        });
      }
      
      // Add topics as tags if available
      if (repoData.topics && Array.isArray(repoData.topics)) {
        setProjectTags(prev => {
          const tags = prev ? prev.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
          repoData.topics.forEach(topic => {
            if (!tags.includes(topic) && topic) {
              tags.push(topic);
            }
          });
          return tags.join(', ');
        });
      }
    } catch (error) {
      console.error("Error importing repository:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to import repository. Please check the URL and try again.");
    }
  };

  // Function to submit the project
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim() || !projectDescription.trim()) {
      setSubmitError("Project name and description are required");
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Prepare project data
      const projectData: Partial<Project> = {
        name: projectName.trim(),
        description: projectDescription.trim(),
        demoUrl: projectUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        tags: projectTags
          ? projectTags
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0)
          : [],
      };
      
      // Call the API to create the project
      await api.createProject(projectData);
      
      // On success, show success message
      setSubmitSuccess(true);
      setSubmitting(false);
    } catch (error) {
      console.error("Error sharing project:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to share project. Please try again.");
      setSubmitting(false);
    }
  };

  // Function to get color for programming language
  const getLanguageColor = (language: string): string => {
    const languageColors: Record<string, string> = {
      'JavaScript': '#f1e05a',
      'Python': '#3572A5',
      'TypeScript': '#2b7489',
      'Java': '#b07219',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'C': '#555555',
      'C++': '#f34b7d',
      'C#': '#178600',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'Shell': '#89e051',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'R': '#198CE7'
    };
    
    return languageColors[language] || '#808080';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="projects" />

      <div className="pt-20 px-8">
        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Page Header */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-4xl font-light mb-3 tracking-tight">Projects</h1>
                    <p className="text-base font-light text-muted-foreground">
                      Discover amazing projects from the developer community
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="font-light bg-accent text-accent-foreground"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Share Project
                  </Button>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    placeholder="Search projects, languages, topics..."
                    className="pl-12 bg-muted/30 border-primary/20 font-light focus:border-primary/40"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>

                {/* GitHub Projects Toggle */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-light text-muted-foreground">Show:</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={!showGitHubProjects ? 'secondary' : 'outline'}
                        className={`font-light ${!showGitHubProjects ? 'text-accent-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setShowGitHubProjects(false)}
                      >
                        <Code2 className="mr-2 h-4 w-4" />
                        Local Projects
                      </Button>
                      <Button
                        variant={showGitHubProjects ? 'secondary' : 'outline'}
                        className={`font-light ${showGitHubProjects ? 'text-accent-foreground bg-accent' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setShowGitHubProjects(true)}
                      >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub Projects
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="space-y-8">
                {showGitHubProjects ? (
                  // GitHub Projects
                  githubLoading ? (
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
                  ) : githubError ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Failed to load GitHub projects: {githubError}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => fetchGitHubProjects(12, undefined, searchQuery)}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : githubProjects.length > 0 ? (
                    githubProjects.map((project) => (
                      <Card key={project.id} className="border-primary/20 bg-card/20 hover-lift">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={project.owner.avatar_url || "/api/placeholder/40/40"} />
                                <AvatarFallback className="text-xs">{project.owner.login[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-light">{project.owner.login}</p>
                                <p className="text-xs text-muted-foreground font-mono">@{project.owner.login}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className="font-light border-primary/40 text-primary text-xs uppercase tracking-[0.1em]">
                                <Github className="mr-1 h-3 w-3" />
                                GitHub
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl font-light mb-3 hover:text-primary cursor-pointer transition-colors flex items-center space-x-2">
                                <Code2 className="h-5 w-5" />
                                <span>{project.name}</span>
                              </CardTitle>
                              <CardDescription className="text-sm font-light text-muted-foreground story-text leading-relaxed">
                                {project.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2 ml-6">
                              <Button variant="outline" size="sm" className="font-light" asChild>
                                <a href={project.html_url} target="_blank" rel="noopener noreferrer">
                                  <Github className="mr-2 h-3 w-3" />
                                  View on GitHub
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-wrap gap-2">
                              {project.topics.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="font-light border-border/30 text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center space-x-4 text-xs text-muted-foreground font-mono">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3" />
                                <span>{project.stargazers_count.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <GitFork className="h-3 w-3" />
                                <span>{project.forks_count}</span>
                              </div>
                              <Badge variant="outline" className="font-light border-border/30 text-xs">
                                {project.language || 'N/A'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button variant="ghost" size="sm" className="font-light" asChild>
                                <a href={project.html_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-2 h-3 w-3" />
                                  Repository
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-light"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(project.html_url, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                <GitBranch className="mr-2 h-3 w-3" />
                                Fork
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No GitHub projects found. Try adjusting your search or filters.</p>
                    </div>
                  )
                ) : (
                  // Local Projects
                  loading ? (
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
                      <p className="text-muted-foreground">Failed to load projects: {error}</p>
                    </div>
                  ) : projects.length > 0 ? (
                    projects.map((project) => (
                      <Card key={project.id} className="border-primary/20 bg-card/20 hover-lift">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={project.author.image || "/api/placeholder/40/40"} />
                                <AvatarFallback className="text-xs">{project.author.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-light">{project.author.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">@{project.author.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {project.featured && (
                                <Badge variant="outline" className="font-light border-primary/40 text-primary text-xs uppercase tracking-[0.1em]">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={`/projects/${project.id}`}>
                                <CardTitle className="text-xl font-light mb-3 hover:text-primary cursor-pointer transition-colors flex items-center space-x-2">
                                  <Code2 className="h-5 w-5" />
                                  <span>{project.name}</span>
                                </CardTitle>
                              </Link>
                              <CardDescription className="text-sm font-light text-muted-foreground story-text leading-relaxed">
                                {project.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2 ml-6">
                              {project.demoUrl && (
                                <Button variant="outline" size="sm" className="font-light" asChild>
                                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                                    <Play className="mr-2 h-3 w-3" />
                                    Demo
                                  </a>
                                </Button>
                              )}
                              {project.githubUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                    <Github className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                              {project.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="font-light border-border/30 text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center space-x-4 text-xs text-muted-foreground font-mono">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3" />
                                  <span>{project.stars.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <GitFork className="h-3 w-3" />
                                  <span>{project.forks}</span>
                                </div>
                                <Badge variant="outline" className="font-light border-border/30 text-xs">
                                  {project.language || 'N/A'}
                                </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-light"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleLikeProject(project.id);
                                }}
                              >
                                <Heart className={`mr-2 h-3 w-3 ${project.isLiked ? 'fill-current text-red-500' : ''}`} />
                                {project._count?.likes || 0}
                              </Button>
                              <Button variant="ghost" size="sm" className="font-light">
                                <MessageCircle className="mr-2 h-3 w-3" />
                                {project._count?.comments || 0}
                              </Button>
                              <Button variant="ghost" size="sm" className="font-light" asChild>
                                <Link href={`/projects/${project.id}`}>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No projects found. Try adjusting your search or filters.</p>
                    </div>
                  )
                )}
              </div>

              {/* Pagination */}
              {showGitHubProjects ? (
                // GitHub projects pagination
                githubProjects.length > 0 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = githubCurrentPage - 1;
                          if (newPage >= 1) {
                            setGithubCurrentPage(newPage);
                            fetchGitHubProjects(itemsPerPage, undefined, searchQuery, newPage);
                          }
                        }}
                        disabled={githubCurrentPage === 1}
                        className="font-light"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-muted-foreground font-light">
                          Page {githubCurrentPage}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = githubCurrentPage + 1;
                          setGithubCurrentPage(newPage);
                          fetchGitHubProjects(itemsPerPage, undefined, searchQuery, newPage);
                        }}
                        className="font-light"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )
              ) : totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="font-light"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        if (totalPages <= 5) return i + 1;

                        if (currentPage <= 3) {
                          if (i < 4) return i + 1;
                          if (i === 4) return totalPages;
                        } else if (currentPage >= totalPages - 2) {
                          if (i === 0) return 1;
                          if (i >= 1) return totalPages - 4 + i;
                        } else {
                          if (i === 0) return 1;
                          if (i === 1) return currentPage - 1;
                          if (i === 2) return currentPage;
                          if (i === 3) return currentPage + 1;
                          if (i === 4) return totalPages;
                        }
                      }).filter(page => page !== undefined).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 p-0 font-light ${
                            currentPage === page
                              ? 'text-foreground bg-accent border-accent'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="font-light"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Following Section */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">From Your Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-light text-muted-foreground mb-4">
                    Projects from users you follow
                  </p>
                  <Button variant="outline" className="w-full font-light" asChild>
                    <Link href="/projects?following=true">
                      View Projects
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Share Your Project */}
              <Card className="border-primary/20 bg-card/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light">Share Your Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-light text-muted-foreground mb-4">
                    Built something amazing? Share it with the community.
                  </p>
                  <Button className="w-full font-light bg-foreground text-background" onClick={() => setShowShareModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Share Project
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Share Project Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl border border-border w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share Your Project</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setShowShareModal(false);
                  setSubmitSuccess(false);
                  setSubmitError(null);
                  // Reset form
                  setProjectName("");
                  setProjectDescription("");
                  setProjectUrl("");
                  setGithubUrl("");
                  setProjectTags("");
                  setRepoUrl("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {submitSuccess ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium mb-2">Project Shared Successfully!</h4>
                <p className="text-muted-foreground mb-6">Your project has been submitted and will be reviewed shortly.</p>
                <Button 
                  onClick={() => {
                    setShowShareModal(false);
                    setSubmitSuccess(false);
                    // Reset form
                    setProjectName("");
                    setProjectDescription("");
                    setProjectUrl("");
                    setGithubUrl("");
                    setProjectTags("");
                    setRepoUrl("");
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitProject}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="repoUrl" className="block text-sm font-medium mb-1">
                        Import from GitHub
                      </label>
                      <div className="flex">
                        <Input
                          id="repoUrl"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder="owner/repo"
                          className="rounded-r-none"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-l-none border border-l-0 border-input"
                          onClick={importRepo}
                        >
                          Import
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter GitHub repo (e.g., "vercel/next.js")
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Or Select from Your Repos
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const githubToken = typeof window !== 'undefined'
                            ? localStorage.getItem('github_token')
                            : null;
                          const mainToken = typeof window !== 'undefined'
                            ? localStorage.getItem('auth_token')
                            : null;

                          if (!mainToken) {
                            setSubmitError("Please log in first.");
                            return;
                          }

                          if (!githubToken) {
                            setSubmitError("GitHub account not linked. Please link it in your profile settings first.");
                            return;
                          }

                          fetchUserRepos();
                        }}
                        disabled={loadingRepos}
                      >
                        {loadingRepos ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Loading...
                          </div>
                        ) : (
                          <>
                            <Github className="mr-2 h-4 w-4" />
                            Select Repository
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="projectUrl" className="block text-sm font-medium mb-1">
                      Live Demo URL
                    </label>
                    <Input
                      id="projectUrl"
                      type="url"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="projectName" className="block text-sm font-medium mb-1">
                      Project Name *
                    </label>
                    <Input
                      id="projectName"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="projectDescription" className="block text-sm font-medium mb-1">
                      Description *
                    </label>
                    <textarea
                      id="projectDescription"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe your project"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="githubUrl" className="block text-sm font-medium mb-1">
                      GitHub Repository URL
                    </label>
                    <Input
                      id="githubUrl"
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="projectTags" className="block text-sm font-medium mb-1">
                      Tags
                    </label>
                    <Input
                      id="projectTags"
                      value={projectTags}
                      onChange={(e) => setProjectTags(e.target.value)}
                      placeholder="e.g., react, typescript, web"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Separate multiple tags with commas
                    </p>
                  </div>
                  
                  {submitError && (
                    <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded-md">
                      {submitError}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowShareModal(false);
                      setSubmitSuccess(false);
                      setSubmitError(null);
                      // Reset form
                      setProjectName("");
                      setProjectDescription("");
                      setProjectUrl("");
                      setGithubUrl("");
                      setProjectTags("");
                      setRepoUrl("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Share Project"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Repository Picker Modal */}
      {showRepoPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl border border-border w-full max-w-2xl max-h-96 overflow-hidden">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold">Select a Repository</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowRepoPicker(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 max-h-80 overflow-y-auto">
              {loadingRepos ? (
                <div className="py-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                  <p className="text-muted-foreground">Loading your repositories...</p>
                </div>
              ) : userRepos.length > 0 ? (
                <div className="space-y-2">
                  {userRepos.map((repo) => (
                    <div 
                      key={repo.id} 
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => selectRepo(repo)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{repo.name}</h4>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {repo.description || "No description provided"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {repo.language && (
                            <span className="flex items-center">
                              <span 
                                className="w-3 h-3 rounded-full mr-1" 
                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                              ></span>
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            {repo.stargazers_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No repositories found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Make sure your GitHub token is valid and you have repositories.
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t p-4 flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowRepoPicker(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}