/**
 * Admin view for managing agent escalated issues
 */
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Send, 
  Eye,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface EscalatedConversation {
  id: string;
  user_id: string;
  agent_id?: string;
  title: string;
  status: 'escalated' | 'in_progress' | 'resolved';
  created_at: string;
  last_message_at: string;
  escalation_reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  user_name?: string;
  user_email?: string;
  agent_name?: string;
  message_count?: number;
  latest_message?: string;
  escalation_info?: {
    escalated_at?: string;
    escalated_by?: string;
  };
  is_escalated?: boolean;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  agent?: {
    id: string;
    full_name: string;
    email: string;
  };
  messages?: Array<{
    id: string;
    sender_type: 'user' | 'ai' | 'agent';
    content: string;
    created_at: string;
    user_id?: string;
  }>;
}

interface AdminEscalationViewProps {
  className?: string;
}

const AdminEscalationView: React.FC<AdminEscalationViewProps> = ({ className = '' }) => {
  const [escalations, setEscalations] = useState<EscalatedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<EscalatedConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'escalated' | 'in_progress' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEscalatedConversations();
  }, []);

  const loadEscalatedConversations = async () => {
    try {
      setIsLoading(true);
      // This would be a new endpoint to get escalated conversations
      const response = await apiService.get('/admin/escalated-conversations');
      setEscalations(response || []);
    } catch (error) {
      console.error('Error loading escalated conversations:', error);
      toast.error('Failed to load escalated conversations');
      // Mock data for demonstration
      setEscalations([
        {
          id: '1',
          user_id: 'user1',
          agent_id: 'agent1',
          title: 'Complex Business Analysis Question',
          status: 'escalated',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          escalation_reason: 'Complex technical question requiring expert knowledge',
          priority: 'high',
          user: {
            id: 'user1',
            full_name: 'John Smith',
            email: 'john.smith@example.com'
          },
          agent: {
            id: 'agent1',
            full_name: 'Sarah Wilson',
            email: 'sarah.wilson@company.com'
          },
          messages: [
            {
              id: 'msg1',
              sender_type: 'user',
              content: 'I need help understanding the difference between functional and non-functional requirements in complex enterprise systems.',
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              user_id: 'user1'
            },
            {
              id: 'msg2',
              sender_type: 'ai',
              content: 'This is a complex question that requires expert knowledge. Let me escalate this to our human experts.',
              created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString()
            }
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationDetails = async (conversationId: string) => {
    try {
      const response = await apiService.get(`/admin/conversations/${conversationId}/details`);
      setSelectedConversation(response);
    } catch (error) {
      console.error('Error loading conversation details:', error);
      toast.error('Failed to load conversation details');
      // Find the conversation from the list and use it without messages
      const conversation = escalations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation({
          ...conversation,
          messages: []
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const response = await apiService.post(`/admin/conversations/${selectedConversation.id}/message`, {
        content: newMessage,
        sender_type: 'agent' // Admin acting as agent
      });

      // Update the conversation with the new message from response
      if (response.success && response.message) {
        const newMsg = {
          id: response.message.id,
          sender_type: response.message.sender_type as 'agent',
          content: response.message.content,
          created_at: response.message.created_at,
          user_id: response.message.user_id
        };

        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), newMsg],
          last_message_at: newMsg.created_at
        } : null);
      }

      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (conversationId: string, newStatus: 'escalated' | 'in_progress' | 'resolved') => {
    try {
      await apiService.patch(`/admin/conversations/${conversationId}/status`, {
        status: newStatus
      });

      setEscalations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, status: newStatus } : conv
      ));

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast.success(`Conversation marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating conversation status:', error);
      toast.error('Failed to update conversation status');
    }
  };

  const filteredEscalations = escalations.filter(conv => {
    const matchesFilter = filter === 'all' || conv.status === filter;
    const matchesSearch = searchTerm === '' || 
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.user?.full_name || conv.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.user?.email || conv.user_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading escalated conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Conversation List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Escalated Issues</h2>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {filteredEscalations.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'escalated', 'in_progress', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : (status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ') || 'Unknown')}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEscalations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No escalated conversations found</p>
            </div>
          ) : (
            filteredEscalations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => loadConversationDetails(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
                    {conversation.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {conversation.priority && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(conversation.priority)}`}>
                        {conversation.priority.toUpperCase()}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(conversation.status)}`}>
                      {conversation.status?.toUpperCase().replace('_', ' ') || 'ESCALATED'}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{conversation.user?.full_name || conversation.user_name || 'Unknown User'}</span>
                  </div>
                  {conversation.latest_message && (
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {conversation.latest_message}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(conversation.last_message_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{conversation.message_count || conversation.messages?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.title}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.user?.full_name || selectedConversation.user_name || 'Unknown User'} 
                    {selectedConversation.user?.email || selectedConversation.user_email ? 
                      ` (${selectedConversation.user?.email || selectedConversation.user_email})` : ''
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedConversation.status}
                    onChange={(e) => handleStatusChange(selectedConversation.id, e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="escalated">Escalated</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(selectedConversation.messages || []).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'user'
                        ? 'bg-gray-100 text-gray-900'
                        : message.sender_type === 'ai'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-green-100 text-green-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender_type === 'user' ? 'User' : 
                         message.sender_type === 'ai' ? 'AI' : 'Agent'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your response as admin..."
                  rows={3}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Select a conversation</p>
              <p>Choose an escalated conversation from the list to view and respond</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEscalationView;
