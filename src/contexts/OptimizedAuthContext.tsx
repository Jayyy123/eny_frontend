/**
 * Optimized authentication context that prevents excessive API calls
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

export const OptimizedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track API calls to prevent duplicates
  const lastUserFetch = useRef<number>(0);
  const userFetchPromise = useRef<Promise<User> | null>(null);
  const isRefreshing = useRef<boolean>(false);
  
  // Cache duration: 10 minutes
  const USER_CACHE_DURATION = 10 * 60 * 1000;

  const refreshUser = useCallback(async (force: boolean = false): Promise<void> => {
    const now = Date.now();
    
    // Prevent duplicate calls
    if (isRefreshing.current && !force) {
      return;
    }
    
    // Use cache if recent and not forced (check localStorage instead of state)
    if (!force && (now - lastUserFetch.current) < USER_CACHE_DURATION) {
      const cached = localStorage.getItem('user_cache');
      if (cached) {
        return; // Already have recent cached data
      }
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (userFetchPromise.current && !force) {
      try {
        await userFetchPromise.current;
        return;
      } catch {
        // Continue with new request if previous failed
      }
    }

    isRefreshing.current = true;
    
    userFetchPromise.current = (async () => {
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        lastUserFetch.current = now;
        
        // Cache in localStorage
        localStorage.setItem('user_cache', JSON.stringify({
          user: userData,
          timestamp: now
        }));
        
        return userData;
      } catch (error) {
        console.error('Error fetching user:', error);
        // Clear invalid session
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_cache');
        setUser(null);
        throw error;
      } finally {
        setLoading(false);
        isRefreshing.current = false;
        userFetchPromise.current = null;
      }
    })();

    await userFetchPromise.current;
  }, []); // Remove user dependency to prevent infinite loop

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login({ email, password });
      
      localStorage.setItem('access_token', response.access_token);
      
      // Fetch user data immediately after login
      await refreshUser(true);
      
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_cache');
    setUser(null);
    lastUserFetch.current = 0;
    isRefreshing.current = false;
    userFetchPromise.current = null;
    toast.success('Logged out successfully');
  }, []);

  // Initialize auth state with cache-first approach
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Try cache first
      try {
        const cached = localStorage.getItem('user_cache');
        if (cached) {
          const { user: cachedUser, timestamp } = JSON.parse(cached);
          const now = Date.now();
          
          if (cachedUser && (now - timestamp) < USER_CACHE_DURATION) {
            setUser(cachedUser);
            lastUserFetch.current = timestamp;
            setLoading(false);
            
            // Optionally refresh in background if cache is getting old
            if ((now - timestamp) > USER_CACHE_DURATION / 2) {
              refreshUser(false).catch(console.error);
            }
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing cached user:', error);
        localStorage.removeItem('user_cache');
      }

      // Fetch fresh data
      await refreshUser(true);
    };

    initAuth();
  }, []); // Empty dependency array - only run on mount

  // Refresh on focus (but not too frequently)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !isRefreshing.current) {
        const now = Date.now();
        if ((now - lastUserFetch.current) >= USER_CACHE_DURATION / 2) {
          refreshUser(false).catch(console.error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []); // Remove dependencies to prevent infinite loop

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

