// API client for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
  // Mock data store
  private mockUsers: User[] = [
    {
      id: 'user-1',
      name: 'Demo User',
      username: 'demo',
      email: 'demo@example.com',
      image: '/api/placeholder/40/40',
      bio: 'Just a demo user',
      location: 'Earth',
      website: 'https://example.com',
      createdAt: new Date().toISOString()
    }
  ];

  private mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Merge Platform',
      description: 'A social platform for developers.',
      stars: 120,
      forks: 45,
      tags: ['react', 'nextjs', 'typescript'],
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: this.mockUsers[0],
      _count: { likes: 50, comments: 12 }
    }
  ];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication - REAL
  async login(email: string, password: string) {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  async register(userData: any) {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  async githubAuth() {
    // Deprecated or removed
    console.warn('GitHub auth is disabled');
  }

  async githubCallback(token: string, user: User) {
    // Deprecated
  }

  async getCurrentUser() {
    const token = this.token;
    if (!token) throw new Error('No token found');

    const res = await fetch(`${this.baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      this.clearToken();
      throw new Error('Session expired');
    }

    return await res.json();
  }

  async logout() {
    this.clearToken();
    // Optional: Call server to invalidate token if using blacklist
  }

  // Feed - MOCKED (Keep existing mocks for Feed, Projects etc for now)
  async getFeed(params?: any) {
    return {
      items: [
        {
          id: 'feed-1',
          type: 'project',
          title: 'Merge Platform',
          description: 'A social platform for developers.',
          author: this.mockUsers[0],
          stats: { stars: 120, forks: 45, likes: 50, comments: 12 },
          tags: ['react', 'nextjs'],
          timeAgo: '2 hours ago',
          featured: true
        }
      ] as FeedItem[],
      pagination: { page: 1, limit: 10, hasMore: false, total: 1 }
    };
  }

  async getTrendingTags() {
    return { tags: [{ name: 'react', count: 10 }, { name: 'javascript', count: 8 }] };
  }

  // Projects - MOCKED
  async getProjects(params?: any) {
    return { projects: this.mockProjects, pagination: { page: 1, limit: 10, total: 1 } };
  }

  async getProject(id: string) {
    return this.mockProjects[0];
  }

  async createProject(projectData: Partial<Project>) {
    console.log('Mock create project:', projectData);
    return { project: { ...this.mockProjects[0], ...projectData, id: `proj-${Date.now()}` } as Project };
  }

  async likeProject(id: string) {
    return { liked: true, message: 'Liked' };
  }

  // Blog Posts - MOCKED
  async getBlogPosts(params?: any) {
    return { posts: [], pagination: { page: 1, limit: 10, total: 0 } };
  }

  async getBlogPost(id: string) {
    return {
      id: 'blog-1',
      title: 'Sample Blog',
      content: 'This is a sample blog post.',
      published: true,
      tags: ['tech'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: this.mockUsers[0],
      _count: { likes: 0, comments: 0 }
    } as BlogPost;
  }

  async createBlogPost(postData: any) {
    return { post: { ...postData, id: `blog-${Date.now()}`, author: this.mockUsers[0] } };
  }

  async likeBlogPost(id: string) {
    return { liked: true, message: 'Liked' };
  }

  // Users - MOCKED
  async getUser(username: string) {
    return this.mockUsers[0];
  }

  async followUser(username: string) {
    return { following: true, message: 'Followed' };
  }

  async updateProfile(userData: Partial<User>) {
    // In real app, PATCH /api/users/me
    return { user: { ...this.mockUsers[0], ...userData } };
  }

  async getGitHubStats(username: string) {
    return {
      publicRepos: 10,
      contributions: 50,
      stars: 100,
      totalForks: 20,
      followers: 5,
      following: 5
    };
  }

  // Notifications - MOCKED
  async getNotifications(params?: any) {
    return { notifications: [], unreadCount: 0, pagination: { page: 1, limit: 10, total: 0 } };
  }

  async markNotificationRead(id: string) { return {}; }
  async markAllNotificationsRead() { return {}; }

  setGitHubToken(token: string) { }

  // Messages - MOCKED
  async getConversations() { return { conversations: [] }; }
  async getMessages(userId: string, params?: any) {
    return {
      messages: [],
      otherUser: this.mockUsers[0],
      pagination: { page: 1, limit: 10, total: 0 }
    };
  }
  async sendMessage(receiverId: string, content: string) { return { message: { id: 'msg-1', content } }; }
  async getUnreadMessageCount() { return { count: 0 }; }
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