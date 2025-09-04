/**
 * Ultra-modern, high-performance streaming chat with inline conversation creation
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Sparkles,
  MessageSquare,
  Check
} from 'lucide-react';
import { Message } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StreamingText } from './StreamingText';
import { ChatSkeleton } from './ChatSkeleton';

interface UltraModernChatProps {
  conversationId?: string;
  onConversationCreate?: (conversationId: string) => void;
  onEnrollmentIntent?: (intent: any) => void; // New prop for enrollment intent handling
  className?: string;
  placeholder?: string;
  showHeader?: boolean;
  isPublic?: boolean;
  userId?: string;
  isAgentMode?: boolean; // New prop to disable helpers and escalation for agent use
}

export const UltraModernChat: React.FC<UltraModernChatProps> = ({
  conversationId,
  onConversationCreate,
  onEnrollmentIntent,
  className = '',
  placeholder = 'Ask me anything...',
  showHeader = true,
  isPublic = false,
  userId,
  isAgentMode = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [isFirstMessage, setIsFirstMessage] = useState(!conversationId);
  const [isSending, setIsSending] = useState(false);
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const lastScrollTop = useRef(0);

  // Enhanced scroll to bottom with user scroll detection
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current) return;
    
    if (force || !isUserScrolledUp) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: force ? 'auto' : 'smooth', 
          block: 'end' 
        });
        setIsUserScrolledUp(false);
        setShowScrollToBottom(false);
      });
    }
  }, [isUserScrolledUp]);

  // Detect user scroll behavior
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider user scrolled up if they're more than 100px from bottom
    const userScrolledUp = distanceFromBottom > 100;
    setIsUserScrolledUp(userScrolledUp);
    setShowScrollToBottom(userScrolledUp);
    
    lastScrollTop.current = scrollTop;
  }, []);

  // Auto-scroll on new messages and streaming content
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-scroll during streaming if user hasn't scrolled up
  useEffect(() => {
    if (isStreaming && !isUserScrolledUp) {
      scrollToBottom();
    }
  }, [streamingContent, isStreaming, isUserScrolledUp, scrollToBottom]);

  const loadMessages = useCallback(async () => {
    if (!currentConversationId || hasLoadedInitialMessages || isLoadingMessages) return;
    
    try {
      setIsLoadingMessages(true);
      console.log('Loading messages for conversation (DB only):', currentConversationId);
      // This now uses the optimized endpoint that only queries DB - no AI/RAG services
      const conversation = await apiService.getConversation(currentConversationId);
      if (conversation.messages) {
        console.log('Loaded messages from DB:', conversation.messages);
        setMessages(conversation.messages);
        setHasLoadedInitialMessages(true);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentConversationId, hasLoadedInitialMessages, isLoadingMessages]); // Only depend on what's actually used

  // Load existing messages only when conversation changes - NO STREAMING
  useEffect(() => {
    if (currentConversationId && !isPublic && !hasLoadedInitialMessages) {
      loadMessages();
    }
  }, [currentConversationId, isPublic, hasLoadedInitialMessages, loadMessages]);

  // Ultra-fast streaming implementation
  const streamMessage = useCallback(async (content: string, conversationId: string) => {
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    
    try {
      const baseUrl = process.env.REACT_APP_STREAMING_URL || '/api/v1/streaming';
      const endpoint = isPublic 
        ? `${baseUrl}/public/chat/stream`
        : `${baseUrl}/chat/stream`;
      
      console.log('Starting stream to:', endpoint, { content, conversationId });
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isPublic ? {} : { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` })
        },
        body: JSON.stringify({
          content,
          conversation_id: conversationId
        }),
        signal: abortController.current.signal
      });
      
      console.log('Stream response:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullContent = '';
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('Stream data:', data);
              
              if (data.type === 'content') {
                fullContent = data.full_content || fullContent + data.content;
                setStreamingContent(fullContent);
              } else if (data.type === 'enrollment_intent') {
                // Handle enrollment intent for lead conversion
                console.log('🎯 UltraModernChat: Enrollment intent detected:', data.intent);
                if (data.intent?.should_show_enrollment_form) {
                  console.log('🎯 UltraModernChat: Calling onEnrollmentIntent with:', data.intent);
                  if (onEnrollmentIntent) {
                    onEnrollmentIntent(data.intent);
                  } else {
                    console.log('🎯 UltraModernChat: ERROR - onEnrollmentIntent is not defined!');
                  }
                } else {
                  console.log('🎯 UltraModernChat: Not calling handler - should_show_enrollment_form is false');
                }
              } else if (data.type === 'complete') {
                setIsStreaming(false);
                setStreamingContent('');
                
                // Add final AI message
                const aiMessage: Message = {
                  id: `ai-${Date.now()}`,
                  conversation_id: conversationId,
                  sender_type: 'ai',
                  content: fullContent,
                  created_at: new Date().toISOString(),
                  confidence_score: data.response?.confidence_score || data.confidence_score,
                  sources: data.response?.sources || data.sources
                };
                
                setMessages(prev => [...prev, aiMessage]);
                
                // Handle enrollment intent from complete response
                if (data.enrollment_intent?.should_show_enrollment_form) {
                  console.log('🎯 UltraModernChat: Complete event enrollment intent:', data.enrollment_intent);
                  if (onEnrollmentIntent) {
                    onEnrollmentIntent(data.enrollment_intent);
                  } else {
                    console.log('🎯 UltraModernChat: ERROR - onEnrollmentIntent not defined for complete event!');
                  }
                }
                
                return;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Streaming error:', error);
        setIsStreaming(false);
        setStreamingContent('');
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          conversation_id: conversationId,
          sender_type: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
          created_at: new Date().toISOString(),
          is_error: true
        };
        
        setMessages(prev => [...prev, errorMessage]);
        toast.error('Failed to get response');
      }
    }
  }, [isPublic]);

  // Optimized message sending with inline conversation creation
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isStreaming || isSending) return;
    
    // If conversation is escalated, only save user message without AI response
    if (isEscalated) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        conversation_id: currentConversationId || 'temp',
        sender_type: 'user',
        content: inputMessage,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Show waiting message
      const waitingMessage: Message = {
        id: `waiting-${Date.now()}`,
        conversation_id: currentConversationId || 'temp',
        sender_type: 'ai',
        content: '⏳ **Your message has been received.** Our human support team will respond to you shortly. Thank you for your patience!',
        created_at: new Date().toISOString(),
        is_system_message: true
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, waitingMessage]);
      }, 500);
      
      return;
    }
    
    // If in agent mode, send agent reply directly
    if (isAgentMode) {
      if (!currentConversationId) {
        toast.error('No conversation selected');
        return;
      }
      
      const messageContent = inputMessage.trim();
      setInputMessage('');
      setIsSending(true);

      try {
        const agentMessage = await apiService.agentReply(currentConversationId, {
          content: messageContent,
          sender_type: 'agent'
        });
        
        setMessages(prev => [...prev, agentMessage]);
        // Force scroll to bottom on new agent message
        setTimeout(() => scrollToBottom(true), 100);
        toast.success('Message sent');
      } catch (error) {
        console.error('Error sending agent reply:', error);
        toast.error('Failed to send message');
      } finally {
        setIsSending(false);
      }
      
      return;
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // Add user message immediately for instant feedback
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      conversation_id: currentConversationId || 'temp',
      sender_type: 'user',
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Force scroll to bottom on new user message
    setTimeout(() => scrollToBottom(true), 100);
    
    // Immediately show thinking indicator
    setIsStreaming(true);
    setStreamingContent('');

    // Handle conversation creation inline with first message
    let activeConversationId = currentConversationId;
    
    if (isFirstMessage && !activeConversationId) {
      try {
        if (isPublic) {
          const response = await apiService.createPublicConversation();
          activeConversationId = response.conversation_id;
        } else {
          // Create conversation with first message to save time
          const response = await apiService.post('/chat/conversations/quick', {
            title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
            first_message: messageContent,
            tags: []
          });
          activeConversationId = response.conversation_id;
        }
        
        setCurrentConversationId(activeConversationId);
        setIsFirstMessage(false);
        setHasLoadedInitialMessages(true); // Mark as loaded since it's a new conversation
        if (activeConversationId) {
          onConversationCreate?.(activeConversationId);
        }
        
        // Update user message with real conversation ID
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, conversation_id: activeConversationId! }
            : msg
        ));
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast.error('Failed to start conversation');
        return;
      }
    }

    // Start streaming response
    if (activeConversationId) {
      try {
        await streamMessage(messageContent, activeConversationId);
      } catch (error) {
        console.error('Error sending message:', error);
        setIsStreaming(false);
        setStreamingContent('');
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          conversation_id: activeConversationId,
          sender_type: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
          created_at: new Date().toISOString(),
          is_error: true
        };
        
        setMessages(prev => [...prev, errorMessage]);
        toast.error('Failed to send message');
      } finally {
        setIsSending(false);
      }
    }
  }, [inputMessage, isStreaming, isSending, currentConversationId, isFirstMessage, isPublic, onConversationCreate, streamMessage, isEscalated, isAgentMode, scrollToBottom]);

  // Direct message sending for suggestions (bypasses input state)
  const handleSendMessageDirect = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isStreaming || isSending) return;

    setIsSending(true);

    // Add user message immediately for instant feedback
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      conversation_id: currentConversationId || 'temp',
      sender_type: 'user',
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Immediately show thinking indicator
    setIsStreaming(true);
    setStreamingContent('');

    // Handle conversation creation inline with first message
    let activeConversationId = currentConversationId;
    
    if (isFirstMessage && !activeConversationId) {
      try {
        if (isPublic) {
          const response = await apiService.createPublicConversation();
          activeConversationId = response.conversation_id;
        } else {
          // Create conversation with first message to save time
          const response = await apiService.post('/chat/conversations/quick', {
            title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
            first_message: messageContent,
            tags: []
          });
          activeConversationId = response.conversation_id;
        }
        
        setCurrentConversationId(activeConversationId);
        setIsFirstMessage(false);
        setHasLoadedInitialMessages(true); // Mark as loaded since it's a new conversation
        if (activeConversationId) {
          onConversationCreate?.(activeConversationId);
        }
        
        // Update user message with real conversation ID
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, conversation_id: activeConversationId || msg.conversation_id }
            : msg
        ));
        
        console.log('Created new conversation:', activeConversationId);
      } catch (error) {
        console.error('Error creating conversation:', error);
        setIsStreaming(false);
        setIsSending(false);
        toast.error('Failed to create conversation');
        return;
      }
    }

    // Stream the AI response
    try {
      await streamMessage(messageContent, activeConversationId || currentConversationId!);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsStreaming(false);
    } finally {
      setIsSending(false);
    }
  }, [isStreaming, isSending, currentConversationId, isFirstMessage, isPublic, onConversationCreate, streamMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleCopyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied!', { duration: 1000 });
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, []);

  // Handle message rating
  const handleRating = useCallback(async (messageId: string, rating: 'positive' | 'negative') => {
    try {
      await apiService.rateMessage(messageId, rating);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  }, []);

  // Handle conversation escalation
  const handleEscalateConversation = useCallback(async () => {
    if (!currentConversationId) {
      toast.error('No active conversation to escalate');
      return;
    }

    setIsEscalating(true);
    try {
      const response = await apiService.post(`/chat/conversations/${currentConversationId}/escalate`);
      if (response.success) {
        setIsEscalated(true);
        toast.success(response.message);
        
        // Add a system message to show escalation
        const escalationMessage: Message = {
          id: `escalation-${Date.now()}`,
          conversation_id: currentConversationId,
          sender_type: 'ai',
          content: '🆘 **This conversation has been escalated to our human support team.**\n\nA human agent will review your messages and respond as soon as possible. Please continue to share any additional details or questions you have.',
          created_at: new Date().toISOString(),
          is_system_message: true
        };
        
        setMessages(prev => [...prev, escalationMessage]);
      }
    } catch (error) {
      console.error('Error escalating conversation:', error);
      toast.error('Failed to escalate conversation. Please try again.');
    } finally {
      setIsEscalating(false);
    }
  }, [currentConversationId]);

  // Memoized message components for performance
  const messageComponents = useMemo(() => {
    return messages.map((message, index) => (
      <MessageBubbleComponent
        key={message.id}
        message={message}
        onCopy={handleCopyMessage}
        onRate={handleRating}
        isLast={index === messages.length - 1}
      />
    ));
  }, [messages, handleCopyMessage, handleRating]);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 ${className}`}>
      {/* Ultra-modern header */}
      {showHeader && (
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              {isStreaming && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">AI Assistant</h3>
              <p className="text-gray-600 text-sm">
                {isStreaming ? 'Thinking and responding...' : 'Ready to help you learn'}
              </p>
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Streaming</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 relative"
        onScroll={handleScroll}
      >
        {isLoadingMessages ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Start Your Conversation
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Ask me anything about our programs, get instant answers, and start your learning journey.
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <QuickActionButton 
                text="📚 Tell me about programs" 
                onClick={async () => {
                  if (isStreaming || isSending) return;
                  await handleSendMessageDirect("Tell me about your programs and courses");
                }}
              />
              <QuickActionButton 
                text="💰 What are the costs?" 
                onClick={async () => {
                  if (isStreaming || isSending) return;
                  await handleSendMessageDirect("What are the program costs and payment options?");
                }}
              />
              <QuickActionButton 
                text="🚀 How do I enroll?" 
                onClick={async () => {
                  if (isStreaming || isSending) return;
                  await handleSendMessageDirect("How can I enroll in a program?");
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {messageComponents}
            
            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <div className="flex gap-4 animate-fadeIn">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 bg-white rounded-3xl rounded-tl-lg p-6 shadow-sm border border-gray-200/50 relative">
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                  <div className="inline-block w-3 h-5 bg-blue-500 ml-2 animate-pulse rounded-sm" />
                </div>
              </div>
            )}
            
            {/* Typing indicator */}
            {isStreaming && !streamingContent && (
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white rounded-3xl rounded-tl-lg p-6 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button with animation */}
      {showScrollToBottom && (
        <div className="absolute bottom-20 right-6 z-10">
          <button
            onClick={() => scrollToBottom(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-white/20"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Ultra-modern input - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-6 sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full px-6 py-4 pr-16 bg-white border-2 border-gray-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 min-h-[60px] max-h-32"
              rows={1}
              disabled={isStreaming}
              style={{ 
                height: 'auto',
                minHeight: '60px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            
            {inputMessage.trim() && (
              <button
                onClick={handleSendMessage}
                disabled={isStreaming || isSending}
                className="absolute right-3 bottom-3 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isStreaming || isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          
          {/* Smart suggestions - Hidden when escalated or in agent mode */}
          {!isStreaming && messages.length > 0 && !isEscalated && !isAgentMode && (
            <div className="flex gap-2 mt-4 justify-center flex-wrap">
              <QuickActionButton 
                text="💡 Explain more" 
                onClick={async () => {
                  if (isStreaming || isSending) return;
                  await handleSendMessageDirect("Can you explain that in more detail?");
                }}
              />
              <QuickActionButton 
                text="📝 Give examples" 
                onClick={async () => {
                  if (isStreaming || isSending) return;
                  await handleSendMessageDirect("Can you provide some examples?");
                }}
              />
              <QuickActionButton 
                text="➡️ What's next?" 
                onClick={async () => {
                  if (isStreaming || isSending) return;
                  await handleSendMessageDirect("What should I do next?");
                }}
              />
              <button
                onClick={handleEscalateConversation}
                disabled={isEscalating}
                className="px-4 py-2 text-sm bg-orange-100 hover:bg-orange-200 border border-orange-200 rounded-2xl text-orange-700 hover:text-orange-900 transition-all duration-200 hover:shadow-md hover:scale-105 font-medium backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEscalating ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Escalating...
                  </>
                ) : (
                  '🆘 Talk to Human'
                )}
              </button>
            </div>
          )}

          {/* Escalated state message - Hidden in agent mode */}
          {isEscalated && !isAgentMode && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
              <div className="flex items-center gap-2 text-orange-800">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Escalated to Human Support</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Your conversation has been transferred to our human support team. Continue typing your messages and they will respond as soon as possible.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Modern quick action button
const QuickActionButton: React.FC<{
  text: string;
  onClick: () => void;
}> = React.memo(({ text, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm bg-white/80 hover:bg-white border border-gray-200 rounded-2xl text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md hover:scale-105 font-medium backdrop-blur-sm"
  >
    {text}
  </button>
));

// Message Bubble Component with Streaming and Rating
interface MessageBubbleProps {
  message: Message;
  onCopy: (content: string) => void;
  onRate: (messageId: string, rating: 'positive' | 'negative') => void;
  isLast: boolean;
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = React.memo(({ message, onCopy, onRate, isLast }) => {
  const [copied, setCopied] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [hasRated, setHasRated] = useState(!!message.user_rating);
  const [currentRating, setCurrentRating] = useState<'positive' | 'negative' | null>(
    message.user_rating === 'helpful' ? 'positive' : 
    message.user_rating === 'not_helpful' ? 'negative' : null
  );
  const isUser = message.sender_type === 'user';
  const isSystemMessage = message.is_system_message;

  const handleCopy = async () => {
    await onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRating = async (rating: 'positive' | 'negative') => {
    if (!message.id || isRating) return;
    
    setIsRating(true);
    try {
      await onRate(message.id, rating);
      setHasRated(true);
      setCurrentRating(rating);
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div className={`flex gap-4 group animate-fadeIn ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
        isUser 
          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
          : isSystemMessage
          ? 'bg-gradient-to-r from-orange-500 to-amber-600'
          : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : isSystemMessage ? (
          <div className="w-5 h-5 text-white">🆘</div>
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`rounded-3xl p-6 shadow-sm border transition-all duration-200 hover:shadow-md ${
          isUser
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-tr-lg border-green-200'
            : 'bg-white border-gray-200/50 rounded-tl-lg'
        }`}>
          {isUser ? (
            <div className="text-white font-medium leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className="text-gray-800">
              <div className="prose prose-sm max-w-none">
                {isLast && message.content ? (
                  <StreamingText 
                    text={message.content} 
                    speed={15}
                    className="leading-relaxed"
                  />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          )}
          
          {/* Message actions for bot messages - Hide rating for agent messages */}
          {!isUser && message.sender_type !== 'agent' && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                title="Copy message"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              
              <button
                onClick={() => handleRating('positive')}
                disabled={isRating}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  currentRating === 'positive'
                    ? 'text-green-600 cursor-default' 
                    : hasRated && currentRating === 'negative'
                    ? 'text-gray-300 cursor-default'
                    : 'text-gray-400 hover:text-green-600'
                }`}
                title="Good response"
              >
                <ThumbsUp className={`w-4 h-4 ${currentRating === 'positive' ? 'fill-current' : ''}`} />
                {currentRating === 'positive' ? 'Helpful!' : 'Helpful'}
              </button>
              
              <button
                onClick={() => handleRating('negative')}
                disabled={isRating}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  currentRating === 'negative'
                    ? 'text-red-600 cursor-default' 
                    : hasRated && currentRating === 'positive'
                    ? 'text-gray-300 cursor-default'
                    : 'text-gray-400 hover:text-red-600'
                }`}
                title="Poor response"
              >
                <ThumbsDown className={`w-4 h-4 ${currentRating === 'negative' ? 'fill-current' : ''}`} />
                {currentRating === 'negative' ? 'Not helpful!' : 'Not helpful'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Add custom CSS for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default UltraModernChat;


