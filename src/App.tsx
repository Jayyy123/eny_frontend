/**
 * Main App component with routing and authentication
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { RoleBasedRoute, StudentRoute, AgentRoute, AdminRoute } from './components/RoleBasedRoute';
import { OptimizedAuthProvider, useAuth } from './contexts/OptimizedAuthContext';
import './styles/animations.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Role-based dashboard component
const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
              <OptimizedAuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Role-specific routes */}
            <Route
              path="/student/*"
              element={
                <StudentRoute>
                  <Layout>
                    <StudentDashboard />
                  </Layout>
                </StudentRoute>
              }
            />
            <Route
              path="/agent/*"
              element={
                <AgentRoute>
                  <Layout>
                    <AgentDashboard />
                  </Layout>
                </AgentRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </AdminRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Enhanced Toast notifications with X button and deduplication */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '16px',
                maxWidth: '400px',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                },
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 6000,
                style: {
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                },
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
              loading: {
                duration: Infinity,
                style: {
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                },
              },
            }}
            containerStyle={{
              top: 80,
              right: 20,
            }}
          />
        </div>
      </Router>
              </OptimizedAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
