/**
 * Authentication hook for managing user state and authentication
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { User, LoginRequest, UserCreate, UserUpdate } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const user = await apiService.getCurrentUser();
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid, clear it
          apiService.clearAuthToken();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const token = await apiService.login(credentials);
      apiService.setAuthToken(token.access_token);
      const user = await apiService.getCurrentUser();
      return user;
    },
    onSuccess: (user) => {
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Login successful!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: UserCreate) => {
      return await apiService.register(userData);
    },
    onSuccess: () => {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Registration failed');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: UserUpdate) => {
      return await apiService.updateCurrentUser(userData);
    },
    onSuccess: (updatedUser) => {
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Update failed');
    },
  });

  // Logout function
  const logout = useCallback(() => {
    apiService.clearAuthToken();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    queryClient.clear();
    toast.success('Logged out successfully');
    navigate('/');
  }, [navigate, queryClient]);

  // Login function
  const login = useCallback((credentials: LoginRequest) => {
    loginMutation.mutate(credentials);
  }, [loginMutation]);

  // Register function
  const register = useCallback((userData: UserCreate) => {
    registerMutation.mutate(userData);
  }, [registerMutation]);

  // Update user function
  const updateUser = useCallback((userData: UserUpdate) => {
    updateUserMutation.mutate(userData);
  }, [updateUserMutation]);

  // Check if user has specific role
  const hasRole = useCallback((role: string) => {
    return authState.user?.role === role;
  }, [authState.user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: string[]) => {
    return authState.user ? roles.includes(authState.user.role) : false;
  }, [authState.user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  // Check if user is agent or admin
  const isAgentOrAdmin = useCallback(() => {
    return hasAnyRole(['agent', 'admin']);
  }, [hasAnyRole]);

  return {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAgentOrAdmin,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdating: updateUserMutation.isPending,
  };
};
