const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  githubUsername?: string;
  techStack?: string[];
  createdAt: string;
  _count?: { followers: number; following: number; posts: number; projects: number };
  isFollowing?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; username: string; image?: string };
}

export interface Post {
  id: string;
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: User;
  _count: { likes: number; comments: number };
  isLiked?: boolean;
  comments?: Comment[];
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
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  _count: { likes: number; comments: number };
  isLiked?: boolean;
  comments?: Comment[];
}

export interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  targetId?: string;
  read: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
  createdAt: string;
  sender: { id: string; name: string; username: string; image?: string };
}

export interface Conversation {
  id: string;
  updatedAt: string;
  participants: { user: User }[];
  messages: Message[];
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── API Client ───────────────────────────────────────────────────────────────

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.getHeaders(), ...(options.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(userData: { email: string; password: string; username: string; name: string }) {
    const data = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  githubAuth() {
    window.location.href = `${this.baseUrl}/auth/github`;
  }

  async githubCallback(token: string, user: User) {
    this.setToken(token);
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // ─── Feed ───────────────────────────────────────────────────────────────────

  async getFeed(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ posts: Post[]; page: number }>(`/feed${q ? '?' + q : ''}`);
  }

  // ─── Explore ────────────────────────────────────────────────────────────────

  async getExplore(params?: { type?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ posts?: Post[]; projects?: Project[]; page: number }>(`/explore${q ? '?' + q : ''}`);
  }

  // ─── Tags ───────────────────────────────────────────────────────────────────

  async getTrendingTags() {
    return this.request<{ tags: { name: string; count: number }[] }>('/tags');
  }

  // ─── Posts ──────────────────────────────────────────────────────────────────

  async getPosts(params?: { page?: number; limit?: number; tag?: string; authorId?: string }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ posts: Post[]; page: number }>(`/posts${q ? '?' + q : ''}`);
  }

  async getPost(id: string) {
    return this.request<{ post: Post }>(`/posts/${id}`);
  }

  async createPost(postData: { content: string; codeSnippet?: string; codeLanguage?: string; imageUrl?: string; tags?: string[] }) {
    return this.request<{ post: Post }>('/posts', { method: 'POST', body: JSON.stringify(postData) });
  }

  async updatePost(id: string, postData: Partial<Post>) {
    return this.request<{ post: Post }>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(postData) });
  }

  async deletePost(id: string) {
    return this.request<{ message: string }>(`/posts/${id}`, { method: 'DELETE' });
  }

  async likePost(id: string) {
    return this.request<{ liked: boolean; count: number }>(`/posts/${id}/like`, { method: 'POST' });
  }

  async unlikePost(id: string) {
    return this.request<{ liked: boolean; count: number }>(`/posts/${id}/like`, { method: 'DELETE' });
  }

  async getPostComments(postId: string, params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ comments: Comment[]; page: number }>(`/posts/${postId}/comments${q ? '?' + q : ''}`);
  }

  async addPostComment(postId: string, content: string) {
    return this.request<{ comment: Comment }>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  // ─── Projects ───────────────────────────────────────────────────────────────

  async getProjects(params?: { page?: number; limit?: number; search?: string; language?: string; tag?: string; featured?: boolean }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ projects: Project[]; page: number }>(`/projects${q ? '?' + q : ''}`);
  }

  async getProject(id: string) {
    return this.request<{ project: Project }>(`/projects/${id}`);
  }

  async createProject(projectData: Partial<Project>) {
    return this.request<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(projectData) });
  }

  async updateProject(id: string, projectData: Partial<Project>) {
    return this.request<{ project: Project }>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(projectData) });
  }

  async deleteProject(id: string) {
    return this.request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' });
  }

  async likeProject(id: string) {
    return this.request<{ liked: boolean; count: number }>(`/projects/${id}/like`, { method: 'POST' });
  }

  async unlikeProject(id: string) {
    return this.request<{ liked: boolean; count: number }>(`/projects/${id}/like`, { method: 'DELETE' });
  }

  async getProjectComments(projectId: string, params?: { page?: number }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ comments: Comment[] }>(`/projects/${projectId}/comments${q ? '?' + q : ''}`);
  }

  async addProjectComment(projectId: string, content: string) {
    return this.request<{ comment: Comment }>(`/projects/${projectId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  async searchUsers(search: string, limit = 20) {
    return this.request<{ users: User[] }>(`/users?search=${encodeURIComponent(search)}&limit=${limit}`);
  }

  async getUser(username: string) {
    return this.request<{ user: User }>(`/users/${username}`);
  }

  async followUser(username: string) {
    return this.request<{ message: string }>(`/users/${username}/follow`, { method: 'POST' });
  }

  async unfollowUser(username: string) {
    return this.request<{ message: string }>(`/users/${username}/follow`, { method: 'DELETE' });
  }

  async getUserFollowers(username: string, page = 1) {
    return this.request<{ followers: User[] }>(`/users/${username}/followers?page=${page}`);
  }

  async getUserFollowing(username: string, page = 1) {
    return this.request<{ following: User[] }>(`/users/${username}/following?page=${page}`);
  }

  // ─── Profile ────────────────────────────────────────────────────────────────

  async getProfile() {
    return this.request<{ user: User }>('/profile');
  }

  async updateProfile(userData: Partial<User>) {
    return this.request<{ user: User }>('/profile', { method: 'PATCH', body: JSON.stringify(userData) });
  }

  // ─── Notifications ──────────────────────────────────────────────────────────

  async getNotifications(params?: { unread?: boolean; page?: number }) {
    const q = new URLSearchParams(params as any).toString();
    return this.request<{ notifications: Notification[]; unreadCount: number }>(`/notifications${q ? '?' + q : ''}`);
  }

  async markNotificationRead(id: string) {
    return this.request<{ notification: Notification }>(`/notifications/${id}`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications', { method: 'PATCH' });
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  async getConversations() {
    return this.request<{ conversations: Conversation[] }>('/conversations');
  }

  async startConversation(userId: string) {
    return this.request<{ conversation: Conversation }>('/conversations', { method: 'POST', body: JSON.stringify({ userId }) });
  }

  async getMessages(conversationId: string, page = 1) {
    return this.request<{ messages: Message[] }>(`/conversations/${conversationId}/messages?page=${page}`);
  }

  async sendMessage(conversationId: string, content: string, codeSnippet?: string, codeLanguage?: string) {
    return this.request<{ message: Message }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, codeSnippet, codeLanguage }),
    });
  }

  // ─── GitHub Stats (external fetch) ──────────────────────────────────────────

  async getGitHubStats(username: string) {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) throw new Error('GitHub user not found');
    return res.json();
  }

  async getGitHubRepos(username: string) {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`);
    if (!res.ok) throw new Error('Failed to fetch repos');
    return res.json();
  }

  setGitHubToken(token: string) {
    // For authenticated GitHub API calls
    this.setToken(token);
  }
}

export const api = new ApiClient(API_BASE_URL);