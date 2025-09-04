/**
 * Chat hook for managing chat state and operations
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import {
  Conversation,
  ConversationCreate,
  ChatMessage,
  ChatResponse,
  Message,
  MessageRating,
} from '../types';

interface ChatState {
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

export const useChat = (conversationId?: string) => {
  const [chatState, setChatState] = useState<ChatState>({
    currentConversation: null,
    messages: [],
    isLoading: false,
    isSending: false,
    error: null,
  });

  const queryClient = useQueryClient();

  // Get conversation data if conversationId is provided
  const {
    data: conversation,
    isLoading: isLoadingConversation,
    error: conversationError,
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => apiService.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Update chat state when conversation data changes
  useEffect(() => {
    if (conversation) {
      setChatState(prev => ({
        ...prev,
        currentConversation: conversation,
        messages: conversation.messages || [],
        isLoading: isLoadingConversation,
        error: conversationError ? 'Failed to load conversation' : null,
      }));
    }
  }, [conversation, isLoadingConversation, conversationError]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: ChatMessage) => {
      if (conversationId) {
        return await apiService.sendMessageToConversation(conversationId, messageData);
      } else {
        return await apiService.sendMessage(messageData);
      }
    },
    onSuccess: (response: ChatResponse) => {
      // Update the conversation in cache
      queryClient.setQueryData(['conversation', response.conversation_id], (old: any) => {
        if (old) {
          return {
            ...old,
            messages: [...(old.messages || []), response.message],
            last_message_at: response.message.created_at,
          };
        }
        return old;
      });

      // Update local state
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, response.message],
        currentConversation: prev.currentConversation ? {
          ...prev.currentConversation,
          id: response.conversation_id,
          last_message_at: response.message.created_at,
        } : null,
        isSending: false,
      }));

      // Show escalation notification if needed
      if (response.should_escalate) {
        toast('Your question has been escalated to a human agent. They will respond shortly.', {
          icon: 'ℹ️',
          duration: 5000,
        });
      }
    },
    onError: (error: any) => {
      setChatState(prev => ({
        ...prev,
        isSending: false,
        error: error.response?.data?.detail || 'Failed to send message',
      }));
      toast.error('Failed to send message. Please try again.');
    },
  });

  // Rate message mutation
  const rateMessageMutation = useMutation({
    mutationFn: async ({ messageId, rating }: { messageId: string; rating: MessageRating }) => {
      // Convert old rating format to new format
      const newRating = rating === 'helpful' ? 'positive' : 'negative';
      return await apiService.rateMessage(messageId, newRating);
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
    },
    onError: (error: any) => {
      toast.error('Failed to submit rating. Please try again.');
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversationData: ConversationCreate) => {
      return await apiService.createConversation(conversationData);
    },
    onSuccess: (newConversation) => {
      setChatState(prev => ({
        ...prev,
        currentConversation: newConversation,
        messages: [],
      }));
      toast.success('New conversation started!');
    },
    onError: (error: any) => {
      toast.error('Failed to create conversation. Please try again.');
    },
  });

  // Send message function
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    setChatState(prev => ({ ...prev, isSending: true, error: null }));

    const messageData: ChatMessage = {
      content: content.trim(),
      conversation_id: conversationId,
    };

    sendMessageMutation.mutate(messageData);
  }, [conversationId, sendMessageMutation]);

  // Rate message function
  const rateMessage = useCallback((messageId: string, rating: MessageRating) => {
    rateMessageMutation.mutate({ messageId, rating });
  }, [rateMessageMutation]);

  // Create new conversation function
  const createConversation = useCallback((conversationData: ConversationCreate = {}) => {
    createConversationMutation.mutate(conversationData);
  }, [createConversationMutation]);

  // Clear error function
  const clearError = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
  }, []);

  // Get suggested actions based on last AI response
  const getSuggestedActions = useCallback(() => {
    const lastAIMessage = [...chatState.messages].reverse().find(
      msg => msg.sender_type === 'ai'
    );
    
    if (!lastAIMessage) return [];

    const actions = [];
    const content = lastAIMessage.content.toLowerCase();

    if (content.includes('program') || content.includes('course')) {
      actions.push('Browse Programs');
    }
    if (content.includes('application') || content.includes('apply')) {
      actions.push('Start Application');
    }
    if (content.includes('payment') || content.includes('tuition')) {
      actions.push('View Payment Options');
    }
    if (content.includes('schedule') || content.includes('time')) {
      actions.push('View Schedule');
    }
    if (content.includes('contact') || content.includes('speak')) {
      actions.push('Contact Support');
    }

    return actions;
  }, [chatState.messages]);

  // Check if conversation is escalated
  const isEscalated = useCallback(() => {
    return chatState.currentConversation?.status === 'escalated';
  }, [chatState.currentConversation]);

  // Get conversation status badge color
  const getStatusBadgeColor = useCallback(() => {
    const status = chatState.currentConversation?.status;
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'escalated':
        return 'badge-warning';
      case 'resolved':
        return 'badge-primary';
      case 'closed':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  }, [chatState.currentConversation]);

  return {
    ...chatState,
    sendMessage,
    rateMessage,
    createConversation,
    clearError,
    getSuggestedActions,
    isEscalated,
    getStatusBadgeColor,
    isCreatingConversation: createConversationMutation.isPending,
    isRating: rateMessageMutation.isPending,
  };
};
