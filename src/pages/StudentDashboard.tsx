/**
 * Ultra-modern Student Dashboard with beautiful UI and UltraModernChat integration
 */
import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Clock,
  Star,
  Award,
  Zap,
  Brain,
  Target,
  Calendar,
  ChevronRight,
  Sparkles,
  Play,
  Users,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/OptimizedAuthContext';
import { apiService } from '../services/api';
import { Conversation, User } from '../types';
import UltraModernChat from '../components/UltraModernChat';
import QuizLearningHub from '../components/QuizLearningHub';
import toast from 'react-hot-toast';

interface ProgramRecommendation {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  rating: number;
  students: number;
  image?: string;
  tags: string[];
}

interface LearningStats {
  totalHours: number;
  completedCourses: number;
  currentStreak: number;
  certificates: number;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [showQuizHub, setShowQuizHub] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [recommendations, setRecommendations] = useState<ProgramRecommendation[]>([]);
  const [stats, setStats] = useState<LearningStats>({
    totalHours: 0,
    completedCourses: 0,
    currentStreak: 0,
    certificates: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  useEffect(() => {
    if (user && !hasLoadedData) {
      loadDashboardData();
    }
  }, [user, hasLoadedData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use optimized endpoint to get dashboard data in a single request
      try {
        console.log('Loading optimized dashboard data...');
        const dashboardData = await apiService.get('/optimized/student/dashboard-data');
        console.log('Loaded optimized data:', dashboardData);
        
        setStats(dashboardData.stats);
        setConversations(dashboardData.conversations || []);
      } catch (optimizedError) {
        console.error('Optimized endpoint failed, falling back to individual calls:', optimizedError);
        
        // Fallback to individual API calls
        try {
          console.log('Loading user conversations...');
          const userConversations = await apiService.getConversations();
          console.log('Loaded conversations:', userConversations);
          setConversations(userConversations || []);
          
          // Load stats
          const statsData = await apiService.get('/student/stats');
          setStats(statsData);
        } catch (error) {
          console.error('Error loading conversations:', error);
          setConversations([]);
        }
      }
      
      // Load Business Analysis programs from API
      try {
        const programs = await apiService.get('/public/programs');
        setRecommendations(programs || []);
      } catch (error) {
        console.error('Error loading programs:', error);
        // Fallback to Business Analysis programs
        setRecommendations([
          {
            id: '1',
            title: 'Business Analysis Fundamentals',
            description: 'Master the core skills of business analysis including requirements gathering, stakeholder management, and process modeling',
            duration: '8 weeks',
            level: 'Beginner',
            rating: 4.9,
            students: 3420,
            tags: ['Requirements Analysis', 'Stakeholder Management', 'Process Modeling', 'Documentation']
          },
          {
            id: '2',
            title: 'Advanced Business Analysis',
            description: 'Dive deep into advanced BA techniques, agile methodologies, and strategic analysis',
            duration: '12 weeks',
            level: 'Advanced',
            rating: 4.8,
            students: 2150,
            tags: ['Agile BA', 'Strategic Analysis', 'Data Analysis', 'Change Management']
          },
          {
            id: '3',
            title: 'Digital Transformation & BA',
            description: 'Learn how to drive digital transformation initiatives as a business analyst',
            duration: '10 weeks',
            level: 'Intermediate',
            rating: 4.7,
            students: 1890,
            tags: ['Digital Transformation', 'Technology Strategy', 'Innovation', 'Leadership']
          }
        ]);
      }
      
      // Load user learning statistics
      try {
        const userStats = await apiService.get('/student/stats');
        setStats(userStats || {
          totalHours: 0,
          completedCourses: 0,
          currentStreak: 0,
          certificates: 0
        });
      } catch (error) {
        console.error('Error loading user stats:', error);
        // Fallback stats for new users
        setStats({
          totalHours: 0,
          completedCourses: 0,
          currentStreak: 1,
          certificates: 0
        });
      }
      
      setHasLoadedData(true); // Mark as loaded to prevent re-fetching
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    setSelectedConversation(null);
    setShowChat(true);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showQuizHub) {
    return (
      <QuizLearningHub
        onBack={() => setShowQuizHub(false)}
        className="min-h-screen"
      />
    );
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="h-screen flex flex-col">
          {/* Modern Chat Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowChat(false)}
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors">
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </div>
                <div>
                  <span className="font-semibold">Back to Dashboard</span>
                  <p className="text-sm text-gray-500">Continue exploring</p>
                </div>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">AI Learning Assistant</h2>
                  <p className="text-sm text-gray-500">Ready to help you learn</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1">
            <UltraModernChat 
              conversationId={selectedConversation || undefined}
              onConversationCreate={(id) => {
                setSelectedConversation(id);
                // Just add the new conversation to the list instead of reloading everything
                setConversations(prev => [
                  { id, title: 'New Chat', created_at: new Date().toISOString(), status: 'active' as const, user_id: user?.id || '', tags: [] },
                  ...prev
                ]);
              }}
              className="h-full"
              placeholder="Ask me anything about your learning journey..."
              userId={user?.id}
              showHeader={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.full_name?.split(' ')[0] || 'Student'}
                </span>! 👋
              </h1>
              <p className="text-xl text-gray-600">Ready to continue your learning journey?</p>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Streak</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-orange-500">{stats.currentStreak}</span>
                  <span className="text-orange-500">🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Learning Hours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Streak Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.certificates}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={handleStartChat}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Start Learning Chat</h3>
                  <p className="text-blue-100">Get instant help from AI</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ask anything!</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowQuizHub(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Brain className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Interactive Quizzes</h3>
                  <p className="text-green-100">Test your knowledge</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Start Learning!</span>
                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">Browse Programs</h3>
                <p className="text-gray-600">Explore courses</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">View catalog</span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">Track Progress</h3>
                <p className="text-gray-600">See your growth</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">View analytics</span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Program Recommendations */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <span>Recommended for You</span>
              </h2>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1">
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-6">
              {recommendations.map((program) => (
                <div key={program.id} className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {program.title}
                        </h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {program.level}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{program.description}</p>
                      
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{program.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{program.rating}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{program.students.toLocaleString()} students</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {program.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button className="ml-6 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center hover:shadow-lg transition-all duration-200 group-hover:scale-110">
                      <Play className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Chats</h2>
              <button 
                onClick={handleStartChat}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
              >
                <span>New Chat</span>
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {conversations.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your First Chat</h3>
                  <p className="text-gray-600 mb-4">Get instant help with your learning questions</p>
                  <button
                    onClick={handleStartChat}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Start Chatting
                  </button>
                </div>
              ) : (
                conversations.slice(0, 5).map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className="w-full group bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {conversation.title || 'Chat Session'}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(conversation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};