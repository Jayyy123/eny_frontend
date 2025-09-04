/**
 * Modern agent chat component with queue management and enhanced features
 */
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  User,
  Filter,
  Search,
  Bell,
  BarChart3,
  Zap
} from 'lucide-react';
import { ModernStreamingChat } from './ModernStreamingChat';
import { apiService } from '../services/api';
import { Conversation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentChatProps {
  className?: string;
}

interface QueueStats {
  total_conversations: number;
  active_conversations: number;
  pending_conversations: number;
  escalated_conversations: number;
  average_response_time: number;
  agent_load: number;
}

export const AgentChat: React.FC<AgentChatProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load agent conversations and stats
  useEffect(() => {
    if (user) {
      loadAgentData();
      
      // Refresh data every 30 seconds
      const interval = setInterval(loadAgentData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAgentData = async () => {
    try {
      const [conversationsData, statsData] = await Promise.all([
        apiService.getAgentConversations(),
        apiService.getAgentStats()
      ]);
      
      setConversations(conversationsData);
      setQueueStats(statsData);
      
      // Auto-select first pending conversation
      const pendingConv = conversationsData.find(c => c.status === 'pending');
      if (pendingConv && !activeConversationId) {
        setActiveConversationId(pendingConv.id);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const handleTakeConversation = async (conversationId: string) => {
    try {
      await apiService.takeConversation(conversationId);
      await loadAgentData(); // Refresh data
      setActiveConversationId(conversationId);
      toast.success('Conversation assigned to you');
    } catch (error) {
      console.error('Error taking conversation:', error);
      toast.error('Failed to take conversation');
    }
  };

  const handleResolveConversation = async (conversationId: string) => {
    try {
      await apiService.resolveConversation(conversationId);
      await loadAgentData(); // Refresh data
      setActiveConversationId(null);
      toast.success('Conversation resolved');
    } catch (error) {
      console.error('Error resolving conversation:', error);
      toast.error('Failed to resolve conversation');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = (conv.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className={`flex h-full bg-slate-50 ${className}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-r border-slate-200 flex flex-col"
          >
            {/* Stats Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <h2 className="text-lg font-semibold mb-3">Agent Dashboard</h2>
              {queueStats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Queue</span>
                    </div>
                    <div className="text-xl font-bold">{queueStats.pending_conversations}</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Avg Response</span>
                    </div>
                    <div className="text-xl font-bold">{Math.round(queueStats.average_response_time)}s</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm">Active</span>
                    </div>
                    <div className="text-xl font-bold">{queueStats.active_conversations}</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">Load</span>
                    </div>
                    <div className="text-xl font-bold">{Math.round(queueStats.agent_load)}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Filter className="w-4 h-4 text-slate-400 mt-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Conversations</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-slate-200 h-20 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No conversations found</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.map((conversation) => (
                    <AgentConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onClick={() => handleConversationSelect(conversation.id)}
                      onTake={() => handleTakeConversation(conversation.id)}
                      onResolve={() => handleResolveConversation(conversation.id)}
                      currentAgentId={user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <div className="flex-1 flex flex-col">
            {/* Conversation Header */}
            {activeConversation && (
              <div className="bg-white border-b border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(activeConversation.status)}`} />
                    <div>
                      <h3 className="font-semibold text-slate-900">{activeConversation.title}</h3>
                      <p className="text-sm text-slate-500">
                        Status: {activeConversation.status} • 
                        Last active: {formatDate(activeConversation.last_message_at || activeConversation.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeConversation.status === 'pending' && (
                      <button
                        onClick={() => handleTakeConversation(activeConversation.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Take
                      </button>
                    )}
                    {activeConversation.status === 'active' && (
                      <button
                        onClick={() => handleResolveConversation(activeConversation.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <ModernStreamingChat
              conversationId={activeConversationId}
              className="flex-1"
              placeholder="Type your response to help the student..."
              showHeader={false}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Agent Dashboard
              </h3>
              <p className="text-slate-600 mb-6 max-w-md">
                Select a conversation from the queue to start helping students with their questions.
              </p>
              {queueStats && queueStats.pending_conversations > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">
                      {queueStats.pending_conversations} conversations waiting
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Agent conversation item component
const AgentConversationItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onTake: () => void;
  onResolve: () => void;
  currentAgentId?: string;
}> = ({ conversation, isActive, onClick, onTake, onResolve, currentAgentId }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    }
  };

  const isAssignedToMe = conversation.agent_id === currentAgentId;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 border ${
        isActive
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md border-transparent'
          : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`} />
          <h4 className={`font-medium ${isActive ? 'text-white' : 'text-slate-900'}`}>
            {conversation.title}
          </h4>
        </div>
        <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
          {formatDate(conversation.last_message_at || conversation.created_at)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className={`w-3 h-3 ${isActive ? 'text-blue-100' : 'text-slate-400'}`} />
          <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
            {conversation.user_id ? 'Student' : 'Anonymous'}
          </span>
          {isAssignedToMe && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              Mine
            </span>
          )}
        </div>

        {!isActive && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {conversation.status === 'pending' && (
              <button
                onClick={onTake}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Take
              </button>
            )}
            {conversation.status === 'active' && isAssignedToMe && (
              <button
                onClick={onResolve}
                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Resolve
              </button>
            )}
          </div>
        )}
      </div>

      {conversation.tags && conversation.tags.length > 0 && (
        <div className="flex gap-1 mt-2">
          {conversation.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded-full ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'active':
      return 'bg-green-500';
    case 'escalated':
      return 'bg-red-500';
    case 'resolved':
      return 'bg-gray-500';
    default:
      return 'bg-slate-500';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default AgentChat;
