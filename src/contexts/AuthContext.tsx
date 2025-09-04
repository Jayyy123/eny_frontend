/**
 * Authentication context with optimized API calls and caching
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUserFetch, setLastUserFetch] = useState<number>(0);

  // Cache user data for 5 minutes to prevent continuous API calls
  const USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const refreshUser = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    
    // Skip if we fetched user data recently and it's not forced
    if (!force && (now - lastUserFetch) < USER_CACHE_DURATION && user) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      setLastUserFetch(now);
      
      // Store user in localStorage for offline access
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error fetching user:', error);
      // Clear invalid token
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [lastUserFetch, user]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login({ email, password });
      
      localStorage.setItem('access_token', response.access_token);
      
      // Fetch user data after login
      await refreshUser(true);
      
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setLastUserFetch(0);
    toast.success('Logged out successfully');
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const cachedUser = localStorage.getItem('user');
      
      if (token) {
        // Try to use cached user data first
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            setLoading(false);
            
            // Refresh in background if cache is old
            const now = Date.now();
            if ((now - lastUserFetch) >= USER_CACHE_DURATION) {
              refreshUser(false);
            }
            return;
          } catch (error) {
            console.error('Error parsing cached user:', error);
          }
        }
        
        // Fetch fresh user data
        await refreshUser(true);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Refresh user data periodically when tab is active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const now = Date.now();
        if ((now - lastUserFetch) >= USER_CACHE_DURATION) {
          refreshUser(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, lastUserFetch, refreshUser]);

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
    login,
    logout,
    refreshUser: () => refreshUser(true),
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
