/**
 * Session management service for conversation continuity
 */
import { apiService } from './api';

interface SessionData {
  sessionId: string;
  conversationId?: string;
  leadId?: string;
  userId?: string;
  sessionType: 'anonymous' | 'lead' | 'user';
  data: Record<string, any>;
  lastActivity: string;
  expiresAt: string;
}

class SessionService {
  private readonly SESSION_KEY = 'eny_session_id';
  private readonly SESSION_DATA_KEY = 'eny_session_data';
  private sessionId: string | null = null;
  private sessionData: SessionData | null = null;

  constructor() {
    try {
      this.initializeSession();
    } catch (error) {
      console.error('Error in SessionService constructor:', error);
      // Create new session as fallback
      this.createNewSession();
    }
  }

  /**
   * Initialize session from localStorage or create new one
   */
  private initializeSession(): void {
    try {
      const storedSessionId = localStorage.getItem(this.SESSION_KEY);
      const storedSessionData = localStorage.getItem(this.SESSION_DATA_KEY);

      if (storedSessionId && storedSessionData) {
        try {
          const parsedData = JSON.parse(storedSessionData);

          // Validate session data structure with fallback
          const isValid = this._safeValidateSessionData(parsedData);

          if (isValid) {
            const expiresAt = new Date(parsedData.expiresAt);

            if (expiresAt > new Date()) {
              this.sessionId = storedSessionId;
              this.sessionData = parsedData;
              // Ensure data object exists
              if (this.sessionData && !this.sessionData.data) {
                this.sessionData.data = {};
              }
              return;
            }
          } else {
            console.warn('Invalid session data structure, creating new session');
          }
        } catch (parseError) {
          console.error('Error parsing stored session data:', parseError);
        }
      }

      // Create new session if none exists, expired, or invalid
      this.createNewSession();
    } catch (error) {
      console.error('Error initializing session:', error);
      // Ensure we have a session even if initialization fails
      if (!this.sessionId) {
        this.createNewSession();
      }
    }
  }

  /**
   * Create a new session
   */
  private createNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionData = {
      sessionId: this.sessionId,
      sessionType: 'anonymous',
      data: {}, // Explicitly initialize empty data object
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    this.saveSession();
  }

  /**
   * Validate session data structure
   */
  public isValidSessionData(data: any): boolean {
    try {
      return (
        data &&
        typeof data === 'object' &&
        typeof data.sessionId === 'string' &&
        typeof data.sessionType === 'string' &&
        typeof data.lastActivity === 'string' &&
        typeof data.expiresAt === 'string' &&
        (data.data === undefined || data.data === null || typeof data.data === 'object')
      );
    } catch (error) {
      console.error('Error validating session data:', error);
      return false;
    }
  }

  /**
   * Safe session data validation with fallback support
   */
  private _safeValidateSessionData(data: any): boolean {
    // Try the main validation method first
    if (typeof this.isValidSessionData === 'function') {
      try {
        return this.isValidSessionData(data);
      } catch (error) {
        console.warn('Main validation failed, using fallback:', error);
      }
    }

    // Fallback validation
    try {
      return (
        data &&
        typeof data === 'object' &&
        typeof data.sessionId === 'string' &&
        typeof data.sessionType === 'string' &&
        typeof data.lastActivity === 'string' &&
        typeof data.expiresAt === 'string'
      );
    } catch (error) {
      console.error('Error in fallback validation:', error);
      return false;
    }
  }

  /**
   * Fallback session data validation (legacy support)
   */
  private _fallbackValidateSessionData(data: any): boolean {
    try {
      return (
        data &&
        typeof data === 'object' &&
        typeof data.sessionId === 'string' &&
        typeof data.sessionType === 'string' &&
        typeof data.lastActivity === 'string' &&
        typeof data.expiresAt === 'string'
      );
    } catch (error) {
      console.error('Error in fallback validation:', error);
      return false;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.sessionId && this.sessionData) {
      localStorage.setItem(this.SESSION_KEY, this.sessionId);
      localStorage.setItem(this.SESSION_DATA_KEY, JSON.stringify(this.sessionData));
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get current session data
   */
  getSessionData(): SessionData | null {
    return this.sessionData;
  }

  /**
   * Update session data
   */
  updateSessionData(updates: Partial<SessionData>): void {
    if (this.sessionData) {
      // Preserve existing data object when updating
      const data = updates.data !== undefined ? updates.data : this.sessionData.data;
      this.sessionData = {
        ...this.sessionData,
        ...updates,
        data, // Ensure data property is preserved
        lastActivity: new Date().toISOString()
      };
      this.saveSession();
    }
  }

  /**
   * Set conversation ID for the session
   */
  setConversationId(conversationId: string): void {
    this.updateSessionData({ conversationId });
    this.syncWithBackend();
  }

  /**
   * Set lead ID for the session
   */
  setLeadId(leadId: string): void {
    this.updateSessionData({ 
      leadId, 
      sessionType: 'lead' 
    });
    this.syncWithBackend();
  }

  /**
   * Set user ID for the session (when user logs in)
   */
  setUserId(userId: string): void {
    this.updateSessionData({ 
      userId, 
      sessionType: 'user' 
    });
    this.syncWithBackend();
  }

  /**
   * Store custom data in session
   */
  setData(key: string, value: any): void {
    // Ensure session is initialized
    if (!this.sessionData) {
      console.warn('Session not initialized, creating new session');
      this.createNewSession();
    }

    if (this.sessionData) {
      // Ensure data object exists
      if (!this.sessionData.data) {
        this.sessionData.data = {};
      }
      
      this.sessionData.data[key] = value;
      this.sessionData.lastActivity = new Date().toISOString();
      
      // Save to localStorage immediately
      this.saveSession();
      
      // Sync with backend asynchronously
      this.syncWithBackend().catch(error => {
        console.warn('Failed to sync session with backend:', error);
      });
    }
  }

  /**
   * Get custom data from session
   */
  getData(key: string): any {
    if (!this.sessionData || !this.sessionData.data) {
      return null;
    }
    return this.sessionData.data[key];
  }

  /**
   * Sync session with backend
   */
  async syncWithBackend(): Promise<void> {
    if (!this.sessionId || !this.sessionData) return;

    try {
      await apiService.post('/lead-conversion/sessions', {
        session_id: this.sessionId,
        conversation_id: this.sessionData.conversationId,
        lead_id: this.sessionData.leadId,
        user_id: this.sessionData.userId,
        session_type: this.sessionData.sessionType,
        data: this.sessionData.data
      });
    } catch (error) {
      console.error('Error syncing session with backend:', error);
    }
  }

  /**
   * Load session from backend
   */
  async loadFromBackend(): Promise<SessionData | null> {
    if (!this.sessionId) return null;

    try {
      const response = await apiService.get(`/lead-conversion/sessions/${this.sessionId}`);
      
      if (response.session_found && response.session_data) {
        this.sessionData = response.session_data;
        this.saveSession();
        return this.sessionData;
      }
    } catch (error) {
      console.error('Error loading session from backend:', error);
    }

    return null;
  }

  /**
   * Clear session (logout or reset)
   */
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_DATA_KEY);
    this.sessionId = null;
    this.sessionData = null;
    this.createNewSession();
  }

  /**
   * Check if session is valid (not expired)
   */
  isSessionValid(): boolean {
    if (!this.sessionData) return false;
    
    const expiresAt = new Date(this.sessionData.expiresAt);
    return expiresAt > new Date();
  }

  /**
   * Extend session expiration
   */
  extendSession(days: number = 30): void {
    const newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    this.updateSessionData({ expiresAt: newExpiresAt });
  }

  /**
   * Get session analytics data
   */
  getAnalytics(): Record<string, any> {
    if (!this.sessionData) return {};

    return {
      sessionId: this.sessionId,
      sessionType: this.sessionData.sessionType,
      sessionAge: Date.now() - new Date(this.sessionData.lastActivity).getTime(),
      hasConversation: !!this.sessionData.conversationId,
      hasLead: !!this.sessionData.leadId,
      hasUser: !!this.sessionData.userId,
      dataKeys: Object.keys(this.sessionData.data)
    };
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;
