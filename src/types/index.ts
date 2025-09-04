/**
 * TypeScript type definitions for the AI Student Support Portal
 */

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_active?: string;
}

export type UserRole = 'student' | 'agent' | 'admin';

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  role: UserRole;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Conversation types
export interface Conversation {
  id: string;
  user_id?: string;
  agent_id?: string;
  status: ConversationStatus;
  title?: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
  last_message_at?: string;
  resolved_at?: string;
  messages?: Message[];
}

export type ConversationStatus = 'active' | 'escalated' | 'resolved' | 'closed' | 'pending';

export interface ConversationCreate {
  title?: string;
  tags?: string[];
}

export interface ConversationUpdate {
  title?: string;
  tags?: string[];
  status?: ConversationStatus;
  agent_id?: string;
}

export interface ConversationSummary {
  id: string;
  title?: string;
  status: ConversationStatus;
  last_message_at?: string;
  message_count: number;
  user_name?: string;
}

// Message types
export interface Message {
  id: string;
  conversation_id: string;
  user_id?: string;
  sender_type: SenderType;
  content: string;
  confidence_score?: number;
  user_rating?: MessageRating;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  sources?: Array<{
    title: string;
    content: string;
    score: number;
  }>;
  is_error?: boolean;
  isStreaming?: boolean;
  is_system_message?: boolean;
}

export type SenderType = 'user' | 'ai' | 'agent';
export type MessageRating = 'helpful' | 'not_helpful';

export interface MessageCreate {
  content: string;
  sender_type: SenderType;
  confidence_score?: number;
}

export interface MessageUpdate {
  content?: string;
  user_rating?: MessageRating;
}

export interface ChatMessage {
  content: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: Message;
  conversation_id: string;
  should_escalate: boolean;
  escalation_reason?: string;
  suggested_actions?: string[];
  confidence_score?: number;
  sources?: Array<{
    title: string;
    content: string;
    score: number;
  }>;
  processing_time?: number;
  enrollment_intent?: {
    has_enrollment_intent: boolean;
    confidence_level: 'high' | 'medium' | 'low';
    interested_program?: string;
    should_show_enrollment_form: boolean;
    reasoning: string;
  };
  metadata?: {
    response_type?: string;
    response_time_ms?: number;
    cache_hit?: boolean;
    ai_model?: string;
    tokens_used?: number;
    sources_used?: number;
  };
}

// Document types
export interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  file_path?: string;
  file_size?: number;
  tags: string[];
  created_at: string;
  updated_at?: string;
  chunk_count?: number;
}

export interface DocumentCreate {
  title: string;
  content: string;
  file_type: string;
  tags?: string[];
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface DocumentUpload {
  title: string;
  tags?: string[];
}

export interface DocumentSearchResult {
  document: Document;
  similarity_score: number;
  relevant_chunk: string;
}

// Lead types
export interface Lead {
  id: string;
  conversation_id?: string;
  name: string;
  email: string;
  phone?: string;
  program_interest?: string;
  source: LeadSource;
  status: LeadStatus;
  lead_score: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  contacted_at?: string;
  converted_at?: string;
}

export type LeadSource = 'chat' | 'form' | 'import' | 'referral';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface LeadCreate {
  name: string;
  email: string;
  phone?: string;
  program_interest?: string;
  notes?: string;
  source?: LeadSource;
  conversation_id?: string;
}

export interface LeadUpdate {
  name?: string;
  email?: string;
  phone?: string;
  program_interest?: string;
  status?: LeadStatus;
  lead_score?: number;
  notes?: string;
}

export interface LeadWithConversation extends Lead {
  conversation_title?: string;
  conversation_status?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Analytics types
export interface SystemAnalytics {
  users: {
    total: number;
    students: number;
    agents: number;
    admins: number;
  };
  conversations: {
    total: number;
    active: number;
    escalated: number;
    resolved: number;
  };
  documents: {
    total: number;
    by_type: Record<string, number>;
  };
  leads: {
    total: number;
    conversion_rate: number;
    by_status: Record<string, number>;
  };
}

export interface AgentDashboard {
  escalated_count: number;
  assigned_count: number;
  resolved_today: number;
  average_response_time_seconds: number;
}

export interface LeadStats {
  total_leads: number;
  conversion_rate: number;
  program_counts: Record<string, number>;
  source_counts: Record<string, number>;
}

export interface DocumentStats {
  total_documents: number;
  file_types: Record<string, number>;
  tag_counts: Record<string, number>;
  total_size: number;
}

// Form types
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  program_interest?: string;
  message?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
  role: UserRole;
}

// UI State types
export interface ChatState {
  conversations: Conversation[];
  currentConversation?: Conversation;
  messages: Message[];
  isLoading: boolean;
  error?: string;
}

export interface AuthState {
  user?: User;
  token?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export interface AgentState {
  escalatedConversations: ConversationSummary[];
  currentConversation?: Conversation;
  isLoading: boolean;
  error?: string;
}

export interface AdminState {
  documents: Document[];
  leads: Lead[];
  users: User[];
  analytics?: SystemAnalytics;
  isLoading: boolean;
  error?: string;
}

// Error types
export interface ApiError {
  detail: string;
  status_code: number;
}

// File upload types
export interface FileUpload {
  file: File;
  title: string;
  tags: string[];
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  status?: string;
  role?: UserRole;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
