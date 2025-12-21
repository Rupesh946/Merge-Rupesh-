// API client for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string; // Made optional
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  githubUsername?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  language?: string;
  stars: number;
  forks: number;
  tags: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  author: User;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
  tags: string[];
  readTime?: number;
  createdAt: string;
  updatedAt: string;
  author: User;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

export interface FeedItem {
  id: string;
  type: 'project' | 'blog' | 'news';
  title: string;
  description: string;
  author: User;
  stats: any;
  tags: string[];
  timeAgo: string;
  featured: boolean;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// API Client class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Get token from localStorage or cookies if available
    if (typeof window !== 'undefined') {
      // First check localStorage
      this.token = localStorage.getItem('auth_token');
      
      // If not in localStorage, check cookies
      if (!this.token) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth_token') {
            this.token = value;
            break;
          }
        }
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      // Also set token in cookie
      document.cookie = `auth_token=${token}; path=/; max-age=60480; secure=${process.env.NODE_ENV === 'production' ? 'true' : 'false'}; samesite=lax`;
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Also clear token from cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00 GMT; samesite=lax';
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Refresh token from storage before each request to handle cases where
    // the token was updated outside of this instance (e.g. from auth callback)
    this.refreshTokenFromStorage();
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as any).Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  // Method to refresh token from storage (localStorage and cookies)
  private refreshTokenFromStorage() {
    if (typeof window !== 'undefined') {
      // First check localStorage
      const localStorageToken = localStorage.getItem('auth_token');
      
      // If not in localStorage, check cookies
      let tokenToUse = localStorageToken;
      if (!tokenToUse) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth_token') {
            tokenToUse = value;
            break;
          }
        }
      }
      
      this.token = tokenToUse;
    }
 }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData: { email: string; password: string; username: string; name: string }) {
    const response = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async githubAuth() {
    // Redirect to GitHub OAuth endpoint
    window.location.href = `${this.baseUrl}/auth/github`;
  }

  async githubCallback(token: string, user: User) {
    // Set token and user after GitHub OAuth
    this.setToken(token);
    return { user, token };
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  async logout() {
    this.clearToken();
  }

  // Feed
  async getFeed(params?: { page?: number; limit?: number; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    return this.request<{ items: FeedItem[]; pagination: any }>(`/feed${query ? `?${query}` : ''}`);
  }

  async getTrendingTags() {
    return this.request<{ tags: Array<{ name: string; count: number }> }>('/feed/trending');
  }

  // Projects
  async getProjects(params?: { page?: number; limit?: number; search?: string; tag?: string; featured?: boolean; author?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.featured) searchParams.set('featured', 'true');
    if (params?.author) searchParams.set('author', params.author);

    const query = searchParams.toString();
    return this.request<{ projects: Project[]; pagination: any }>(`/projects${query ? `?${query}` : ''}`);
  }

  async getProject(id: string) {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(projectData: Partial<Project>) {
    return this.request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async likeProject(id: string) {
    return this.request<{ liked: boolean; message: string }>(`/projects/${id}/like`, {
      method: 'POST',
    });
  }

  // Blog Posts (Insights)
  async getBlogPosts(params?: { page?: number; limit?: number; search?: string; tag?: string; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    return this.request<{ posts: BlogPost[]; pagination: any }>(`/blogs${query ? `?${query}` : ''}`);
  }

  async getBlogPost(id: string) {
    return this.request<BlogPost>(`/blogs/${id}`);
  }

  async createBlogPost(postData: Partial<BlogPost>) {
    return this.request<{ post: BlogPost }>('/blogs', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async likeBlogPost(id: string) {
    return this.request<{ liked: boolean; message: string }>(`/blogs/${id}/like`, {
      method: 'POST',
    });
  }

  // Users
  async getUser(username: string) {
    return this.request<User>(`/users/${username}`);
  }

  async followUser(username: string) {
    return this.request<{ following: boolean; message: string }>(`/users/${username}/follow`, {
      method: 'POST',
    });
  }

  async updateProfile(userData: Partial<User>) {
    return this.request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getGitHubStats(username: string) {
    // This would fetch GitHub stats from GitHub API
    try {
      // Construct the API URL with parameters
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Merge-App'
      };

      // Check if we have a GitHub token in localStorage
      const githubToken = typeof window !== 'undefined'
        ? localStorage.getItem('github_token')
        : undefined;

      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      // Fetch user's basic info from GitHub API
      const response = await fetch(`https://api.github.com/users/${username}`, { headers });
      if (!response.ok) {
        throw new Error(`GitHub API request failed with status ${response.status}`);
      }
      const data = await response.json();

      // Fetch user's repositories to get stars and other metrics
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
      if (!reposResponse.ok) {
        throw new Error(`GitHub API request for repos failed with status ${reposResponse.status}`);
      }
      const repos = await reposResponse.json();

      // Calculate total stars across all repos
      const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);

      // Calculate total forks across all repos as another metric
      const totalForks = repos.reduce((sum: number, repo: any) => sum + repo.forks_count, 0);

      // For contributions, GitHub doesn't provide a simple API endpoint for the contribution count
      // that matches the profile page. The contribution count on the profile page includes
      // private contributions which are only available to the user themselves.
      // For public contributions, we can try to estimate using events
      let contributions = 0;
      try {
        // Try to get user's events to estimate contributions
        const eventsResponse = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, { headers });
        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          // Count programming-related events as contributions
          const contributionEvents = ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CommitCommentEvent',
                                    'PullRequestReviewEvent', 'PullRequestReviewCommentEvent'];
          contributions = events.filter((event: any) =>
            contributionEvents.includes(event.type)
          ).length;
        }
      } catch (eventsError) {
        console.error('Error fetching user events:', eventsError);
        // Fallback to 0 contributions if events API fails
        contributions = 0;
      }

      return {
        publicRepos: data.public_repos || 0,
        contributions: contributions,
        stars: totalStars || 0,
        totalForks: totalForks || 0,
        followers: data.followers || 0,
        following: data.following || 0
      };
    } catch (error) {
      console.error('Error fetching GitHub stats:', error);
      // Return default values if GitHub API call fails
      return {
        publicRepos: 0,
        contributions: 0,
        stars: 0,
        totalForks: 0,
        followers: 0,
        following: 0
      };
    }
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number; unread?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.unread) searchParams.set('unread', 'true');

    const query = searchParams.toString();
    return this.request<{ notifications: any[]; unreadCount: number; pagination: any }>(`/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Add method to set GitHub token
  setGitHubToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('github_token', token);
    }
  }

  // Messages
  async getConversations() {
    return this.request<{ conversations: any[] }>('/messages/conversations');
  }

  async getMessages(userId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<{ messages: any[]; otherUser: User; pagination: any }>(`/messages/${userId}${query ? `?${query}` : ''}`);
  }

  async sendMessage(receiverId: string, content: string) {
    return this.request<{ message: any }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    });
  }

  async getUnreadMessageCount() {
    return this.request<{ count: number }>('/messages/unread/count');
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL);

// Utility functions
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
};

export const transformFeedItem = (item: any): FeedItem => {
  // Ensure tags is always an array
  const tags = Array.isArray(item.tags) ? item.tags : [];
  
  // Handle different data structures from API
  const stats = item.stats || {
    stars: item.stars || 0,
    forks: item.forks || 0,
    likes: item._count?.likes || 0,
    comments: item._count?.comments || 0,
    points: item.points || 0,
    readTime: item.readTime ? `${item.readTime} min read` : undefined
  };

  return {
    ...item,
    tags,
    stats,
    timeAgo: formatTimeAgo(item.createdAt),
    description: item.description || item.excerpt || (item.content ? item.content.substring(0, 200) + '...' : ''),
    author: item.author || {
      name: item.author?.name || 'Unknown',
      username: item.author?.username || 'unknown',
      avatar: item.author?.image || '/api/placeholder/40/40'
    }
  };
};