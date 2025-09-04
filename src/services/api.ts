/**
 * API service for communicating with the backend
 */
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  User,
  UserCreate,
  UserUpdate,
  LoginRequest,
  Token,
  Conversation,
  ConversationCreate,
  ConversationSummary,
  Message,
  MessageCreate,
  ChatMessage,
  ChatResponse,
  Document,
  DocumentUpdate,
  Lead,
  LeadCreate,
  LeadUpdate,
  LeadStats,
  SystemAnalytics,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds cache

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to perform this action');
        } else if (error.response?.status && error.response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.response?.data) {
          const errorData = error.response.data as any;
          toast.error(errorData.detail || 'An error occurred');
        } else {
          toast.error('Network error. Please check your connection.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await this.api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async register(userData: UserCreate): Promise<User> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateCurrentUser(userData: UserUpdate): Promise<User> {
    const response = await this.api.put('/auth/me', userData);
    return response.data;
  }

  // Chat endpoints
  async createConversation(conversationData: ConversationCreate): Promise<Conversation> {
    const response = await this.api.post('/chat/conversations', conversationData);
    return response.data;
  }



  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  }

  async sendMessage(messageData: ChatMessage): Promise<ChatResponse> {
    const response = await this.api.post('/chat/messages', messageData);
    return response.data;
  }

  async sendMessageToConversation(
    conversationId: string,
    messageData: ChatMessage
  ): Promise<ChatResponse> {
    const response = await this.api.post(
      `/chat/conversations/${conversationId}/messages`,
      messageData
    );
    return response.data;
  }


  async getUserConversations(): Promise<Conversation[]> {
    const response = await this.api.get('/chat/conversations');
    return response.data;
  }

  // Optimized chat endpoints
  async sendFastMessage(messageData: ChatMessage): Promise<ChatResponse> {
    const response = await this.api.post('/chat/messages/fast', messageData);
    return response.data;
  }

  // Streaming endpoints
  createStreamingConnection(endpoint: string): EventSource {
    const url = `${this.api.defaults.baseURL}${endpoint}`;
    return new EventSource(url, {
      withCredentials: true
    });
  }

  async streamMessage(messageData: ChatMessage): Promise<EventSource> {
    // Create streaming connection
    const eventSource = this.createStreamingConnection('/streaming/chat/stream');
    
    // Send initial message data
    setTimeout(async () => {
      try {
        await this.api.post('/streaming/chat/stream', messageData);
      } catch (error) {
        console.error('Error sending streaming message:', error);
      }
    }, 100);
    
    return eventSource;
  }

  async streamPublicMessage(messageData: ChatMessage): Promise<EventSource> {
    // Create streaming connection
    const eventSource = this.createStreamingConnection('/streaming/public/chat/stream');
    
    // Send initial message data
    setTimeout(async () => {
      try {
        await this.api.post('/streaming/public/chat/stream', messageData);
      } catch (error) {
        console.error('Error sending public streaming message:', error);
      }
    }, 100);
    
    return eventSource;
  }

  // Agent endpoints
  async getEscalationQueue(): Promise<ConversationSummary[]> {
    const response = await this.api.get('/agent/queue');
    return response.data;
  }

  async getAgentConversation(conversationId: string): Promise<Conversation> {
    const response = await this.api.get(`/agent/conversations/${conversationId}`);
    return response.data;
  }

  async agentReply(conversationId: string, messageData: MessageCreate): Promise<Message> {
    const response = await this.api.post(
      `/agent/conversations/${conversationId}/reply`,
      messageData
    );
    return response.data;
  }



  async getAgentDashboard(): Promise<any> {
    const response = await this.api.get('/agent/dashboard');
    return response.data;
  }

  // Admin endpoints
  async getSystemAnalytics(): Promise<SystemAnalytics> {
    const response = await this.api.get('/admin/analytics');
    return response.data;
  }

  async uploadDocument(
    file: File,
    title: string,
    tags: string = ''
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('tags', tags);

    const response = await this.api.post('/admin/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDocuments(
    skip: number = 0,
    limit: number = 100,
    tags?: string
  ): Promise<Document[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (tags) params.append('tags', tags);

    const response = await this.api.get(`/admin/documents?${params}`);
    return response.data;
  }

  async updateDocument(documentId: string, documentData: DocumentUpdate): Promise<Document> {
    const response = await this.api.put(`/admin/documents/${documentId}`, documentData);
    return response.data;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.api.delete(`/admin/documents/${documentId}`);
  }

  async getLeads(
    skip: number = 0,
    limit: number = 100,
    status?: string,
    source?: string
  ): Promise<Lead[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (source) params.append('source', source);

    const response = await this.api.get(`/admin/leads?${params}`);
    return response.data;
  }

  async updateLead(leadId: string, leadData: LeadUpdate): Promise<Lead> {
    const response = await this.api.put(`/admin/leads/${leadId}`, leadData);
    return response.data;
  }

  async getUsers(skip: number = 0, limit: number = 100): Promise<User[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const response = await this.api.get(`/admin/users?${params}`);
    return response.data;
  }

  async createUser(userData: UserCreate): Promise<User> {
    const response = await this.api.post('/admin/users', userData);
    return response.data;
  }

  // Lead capture endpoints
  async createLead(leadData: LeadCreate): Promise<Lead> {
    const response = await this.api.post('/leads/', leadData);
    return response.data;
  }

  async getLeadStats(): Promise<LeadStats> {
    const response = await this.api.get('/leads/stats');
    return response.data;
  }

  // Public endpoints (no auth required)
  async createPublicConversation(): Promise<{ conversation_id: string; db_conversation_id: string }> {
    const response = await this.api.post('/public/chat/conversation');
    return response.data;
  }

  async sendPublicMessage(conversationId: string, content: string): Promise<ChatResponse> {
    const response = await this.api.post('/public/chat/message', {
      conversation_id: conversationId,
      content: content
    });
    return response.data;
  }

  async getPublicConversation(conversationId: string): Promise<any> {
    const response = await this.api.get(`/public/chat/conversation/${conversationId}`);
    return response.data;
  }

  async convertConversationToUser(conversationId: string, userData: UserCreate): Promise<any> {
    const response = await this.api.post(`/public/chat/convert-to-user`, {
      conversation_id: conversationId,
      ...userData
    });
    return response.data;
  }

  async createLeadFromChat(conversationId: string, leadData: LeadCreate): Promise<any> {
    const response = await this.api.post(`/public/chat/create-lead`, {
      conversation_id: conversationId,
      ...leadData
    });
    return response.data;
  }

  async getPublicPrograms(): Promise<any[]> {
    const response = await this.api.get('/public/programs');
    return response.data;
  }

  async getPublicStats(): Promise<any> {
    const response = await this.api.get('/public/stats');
    return response.data;
  }

  // Agent methods
  async getAgentConversations(): Promise<Conversation[]> {
    const response = await this.api.get('/agent/conversations');
    return response.data;
  }

  async getAgentStats(): Promise<any> {
    const response = await this.api.get('/agent/stats');
    return response.data;
  }

  async takeConversation(conversationId: string): Promise<any> {
    const response = await this.api.post(`/agent/conversations/${conversationId}/take`);
    return response.data;
  }

  async resolveConversation(conversationId: string): Promise<any> {
    const response = await this.api.post(`/agent/conversations/${conversationId}/resolve`);
    return response.data;
  }

  // Enhanced Admin Analytics
  async getComprehensiveAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await this.api.get(`/admin/analytics/comprehensive?${params.toString()}`);
    return response.data;
  }

  async getLeadConversionRecommendations(leadId: string): Promise<any> {
    const response = await this.api.get(`/admin/analytics/lead-conversion/${leadId}`);
    return response.data;
  }

  async getRealTimePerformance(): Promise<any> {
    const response = await this.api.get('/admin/performance/real-time');
    return response.data;
  }

  async clearCache(cacheType?: string): Promise<any> {
    const params = cacheType ? `?cache_type=${cacheType}` : '';
    const response = await this.api.post(`/admin/cache/clear${params}`);
    return response.data;
  }

  async createPublicLead(data: LeadCreate): Promise<Lead> {
    const response = await this.api.post('/leads/', data);
    return response.data;
  }

  // Streaming chat endpoint
  async sendStreamingMessage(data: ChatMessage): Promise<ReadableStream<Uint8Array>> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${process.env.REACT_APP_STREAMING_URL || '/api/v1/streaming'}/chat/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.body!;
  }

  // Cache methods
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`Cache hit for ${key}`);
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`Cached ${key}`);
  }

  // Conversation methods with caching
  async getConversations(): Promise<Conversation[]> {
    const cacheKey = 'conversations';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get('/chat/conversations');
      const data = response.data || [];
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Clear local cache when needed
  clearLocalCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Message rating
  async rateMessage(messageId: string, rating: 'positive' | 'negative', feedback?: string): Promise<any> {
    try {
      const response = await this.api.patch(`/chat/messages/${messageId}/rating`, {
        rating,
        feedback: feedback || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error rating message:', error);
      throw error;
    }
  }

  // Public message rating (no auth required)
  async rateMessagePublic(messageId: string, rating: 'positive' | 'negative', feedback?: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || '/api/v1'}/public/messages/${messageId}/rating`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback: feedback || ''
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error rating message (public):', error);
      throw error;
    }
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  clearAuthToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
