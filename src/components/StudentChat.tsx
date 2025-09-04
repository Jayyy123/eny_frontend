/**
 * Modern student chat component with enhanced features
 */
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter,
  Clock,
  Star,
  Archive,
  MoreHorizontal
} from 'lucide-react';
import { ModernStreamingChat } from './ModernStreamingChat';
import { apiService } from '../services/api';
import { Conversation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentChatProps {
  className?: string;
}

export const StudentChat: React.FC<StudentChatProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  // Load user conversations
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const data = await apiService.getConversations();
      setConversations(data);
      
      // Set first conversation as active if none selected
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConversation = await apiService.createConversation({
        title: 'New Chat',
        tags: []
      });
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      toast.success('New conversation started');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create new conversation');
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const filteredConversations = conversations.filter(conv =>
    (conv.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className={`flex h-full bg-slate-50 ${className}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-r border-slate-200 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">My Chats</h2>
                <button
                  onClick={createNewConversation}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="New Chat"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
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
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-slate-200 h-16 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No conversations found</p>
                  <button
                    onClick={createNewConversation}
                    className="mt-2 text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Start your first chat
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onClick={() => handleConversationSelect(conversation.id)}
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
          <ModernStreamingChat
            conversationId={activeConversationId}
            className="flex-1"
            placeholder="Ask me about your courses, assignments, or anything else..."
            showHeader={true}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Welcome to your AI Assistant
              </h3>
              <p className="text-slate-600 mb-6 max-w-md">
                Get instant help with your courses, assignments, and learning journey. Start a conversation to begin.
              </p>
              <button
                onClick={createNewConversation}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors md:hidden"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};

// Conversation item component
const ConversationItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}> = ({ conversation, isActive, onClick }) => {
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

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${
        isActive
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
          : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
            {conversation.title}
          </h4>
          <p className={`text-sm truncate mt-1 ${
            isActive ? 'text-blue-100' : 'text-slate-500'
          }`}>
            {conversation.status === 'active' ? 'Active conversation' : 'Resolved'}
          </p>
        </div>
        <div className="flex flex-col items-end ml-2">
          <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
            {formatDate(conversation.last_message_at || conversation.created_at)}
          </span>
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {conversation.tags.slice(0, 2).map((tag, index) => (
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
        </div>
      </div>
    </motion.div>
  );
};

export default StudentChat;
