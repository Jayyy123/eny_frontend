/**
 * Ultra-modern Agent Dashboard with UltraModernChat integration
 */
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Timer,
  ChevronRight,
  Shield,
  Activity,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/OptimizedAuthContext';
import { apiService } from '../services/api';
import { ConversationSummary, Conversation } from '../types';
import UltraModernChat from '../components/UltraModernChat';
import toast from 'react-hot-toast';

interface AgentStats {
  escalated_count: number;
  assigned_count: number;
  resolved_today: number;
  average_response_time_seconds: number;
}

interface AgentDashboardData {
  stats: AgentStats;
  public_queue: ConversationSummary[];
  personal_queue: ConversationSummary[];
  total_public: number;
  total_personal: number;
}

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<AgentDashboardData | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'personal'>('public');
  const [takingConversation, setTakingConversation] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Single optimized API call
      const data = await apiService.getAgentDashboard();
      setDashboardData(data);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      setLoadingChat(conversationId);
      setChatLoading(true);
      setShowChat(true);
      setSelectedConversation(null); // Clear previous conversation
      
      const conversation = await apiService.getAgentConversation(conversationId);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
      setShowChat(false); // Close chat on error
    } finally {
      setLoadingChat(null);
      setChatLoading(false);
    }
  };

  const handleTakeConversation = async (conversationId: string) => {
    try {
      setTakingConversation(conversationId);
      const result = await apiService.takeConversation(conversationId);
      toast.success(`Conversation assigned to ${result.agent_name}`);
      loadDashboardData();
    } catch (error: any) {
      console.error('Error taking conversation:', error);
      if (error.response?.status === 409) {
        toast.error('Conversation already assigned to another agent');
      } else {
        toast.error('Failed to take conversation');
      }
    } finally {
      setTakingConversation(null);
    }
  };

  const handleResolveConversation = async (conversationId: string) => {
    try {
      await apiService.resolveConversation(conversationId);
      toast.success('Conversation resolved successfully');
      setShowChat(false);
      setSelectedConversation(null);
      loadDashboardData();
    } catch (error) {
      console.error('Error resolving conversation:', error);
      toast.error('Failed to resolve conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="h-screen flex flex-col">
          {/* Modern Chat Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowChat(false);
                  setSelectedConversation(null);
                  setChatLoading(false);
                }}
                className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors">
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </div>
                <div>
                  <span className="font-semibold">Back to Queue</span>
                  <p className="text-sm text-gray-500">Return to dashboard</p>
                </div>
              </button>
              
              {selectedConversation ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Conversation #{selectedConversation.id.slice(-8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Started {new Date(selectedConversation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleResolveConversation(selectedConversation.id)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Mark Resolved
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="h-9 bg-gray-200 rounded-xl w-28 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1">
            {chatLoading || !selectedConversation ? (
              <div className="h-full flex flex-col">
                {/* Chat skeleton */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="flex-1 flex justify-end">
                      <div className="max-w-xs">
                        <div className="h-4 bg-blue-200 rounded w-full mb-2 animate-pulse"></div>
                        <div className="h-4 bg-blue-200 rounded w-2/3 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-blue-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-5/6 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Input skeleton */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="w-12 h-12 bg-blue-200 rounded-xl animate-pulse"></div>
                  </div>
                </div>
                
                {/* Loading indicator */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Loader className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-gray-600 font-medium">Loading conversation...</p>
                  </div>
                </div>
              </div>
            ) : (
              <UltraModernChat 
                conversationId={selectedConversation.id}
                className="h-full"
                placeholder="Type your response to help the student..."
                userId={user?.id}
                showHeader={false}
                isAgentMode={true}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Agent Dashboard
                </span> 🎧
              </h1>
              <p className="text-xl text-gray-600">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Agent'}! Ready to help students?
              </p>
            </div>
            
            <button
              onClick={loadDashboardData}
              className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Agent Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Escalated</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats.escalated_count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">My Active</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats.assigned_count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats.resolved_today || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats.average_response_time_seconds 
                    ? `${Math.round(dashboardData.stats.average_response_time_seconds / 60)}m`
                    : '0m'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Live Queue</h3>
                <p className="text-blue-100">Monitor active conversations</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {(dashboardData?.total_public || 0) + (dashboardData?.total_personal || 0)} total
              </span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Performance</h3>
                <p className="text-gray-600">View your metrics</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Analytics</span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Knowledge Base</h3>
                <p className="text-gray-600">Access resources</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Browse docs</span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Escalation Queue with Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-lg">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <AlertCircle className="w-6 h-6 text-orange-500" />
                <span>Escalation Queue</span>
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Live Updates</span>
              </div>
            </div>
            
            {/* Queue Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setActiveTab('public')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'public'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Public Queue ({dashboardData?.total_public || 0})
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'personal'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Queue ({dashboardData?.total_personal || 0})
              </button>
            </div>
            
            {/* Queue Content */}
            {(() => {
              const currentQueue = activeTab === 'public' 
                ? dashboardData?.public_queue || []
                : dashboardData?.personal_queue || [];
              
              return currentQueue.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {activeTab === 'public' ? 'No Public Queue! 🎉' : 'No Personal Queue! 🎉'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'public' 
                      ? 'No unassigned escalated conversations at the moment.'
                      : 'No conversations assigned to you at the moment.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentQueue.map((conversation) => (
                    <div key={conversation.id} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {conversation.user_name || 'Anonymous User'}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {conversation.last_message_at 
                                    ? new Date(conversation.last_message_at).toLocaleTimeString()
                                    : 'No recent activity'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {conversation.message_count || 0} messages
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleSelectConversation(conversation.id)}
                            disabled={loadingChat === conversation.id}
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {loadingChat === conversation.id ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <span>View Chat</span>
                            )}
                          </button>
                          {activeTab === 'public' && (
                            <button
                              onClick={() => handleTakeConversation(conversation.id)}
                              disabled={takingConversation === conversation.id}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {takingConversation === conversation.id ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  <span>Taking...</span>
                                </>
                              ) : (
                                <span>Take Conversation</span>
                              )}
                            </button>
                          )}
                          {activeTab === 'personal' && (
                            <span className="text-sm text-green-600 font-medium px-3 py-2 bg-green-50 rounded-xl">
                              Assigned to You
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {conversation.title && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-700 font-medium">Latest Topic:</p>
                          <p className="text-sm text-gray-600 mt-1">{conversation.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};