/**
 * Ultra-fast streaming chat component with real-time responses and markdown
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
  Zap,
  MessageSquare
} from 'lucide-react';
import { Message, ChatMessage, ChatResponse } from '../types';
import { apiService } from '../services/api';
import { streamingService } from '../services/streamingService';
import MarkdownRenderer from './MarkdownRenderer';
import TypingIndicator from './TypingIndicator';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernStreamingChatProps {
  conversationId?: string;
  onConversationCreate?: (conversationId: string) => void;
  className?: string;
  placeholder?: string;
  showHeader?: boolean;
  isPublic?: boolean;
}

export const ModernStreamingChat: React.FC<ModernStreamingChatProps> = ({
  conversationId,
  onConversationCreate,
  className = '',
  placeholder = 'Ask me anything...',
  showHeader = true,
  isPublic = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingMessageId = useRef<string | null>(null);

  // Optimized scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, streamingContent, scrollToBottom]);

  // Load existing conversation messages (optimized)
  useEffect(() => {
    if (currentConversationId && !isPublic) {
      loadConversationMessages();
    }
  }, [currentConversationId, isPublic]);

  const loadConversationMessages = useCallback(async () => {
    if (!currentConversationId) return;
    
    try {
      const conversation = await apiService.getConversation(currentConversationId);
      if (conversation.messages) {
        setMessages(conversation.messages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [currentConversationId]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage, adjustTextareaHeight]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading || isStreaming) return;

    // Create conversation if needed (fast)
    let activeConversationId = currentConversationId;
    if (!activeConversationId) {
      try {
        let newConversation;
        
        if (isPublic) {
          newConversation = await apiService.createPublicConversation();
          activeConversationId = newConversation.conversation_id;
        } else {
          newConversation = await apiService.createConversation({
            title: 'New Chat',
            tags: []
          });
          activeConversationId = newConversation.id;
        }
        
        setCurrentConversationId(activeConversationId);
        onConversationCreate?.(activeConversationId);
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast.error('Failed to start conversation');
        return;
      }
    }

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      conversation_id: activeConversationId!,
      sender_type: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Create placeholder for AI response
    const aiMessageId = `ai-${Date.now()}`;
    streamingMessageId.current = aiMessageId;
    
    const placeholderMessage: Message = {
      id: aiMessageId,
      conversation_id: activeConversationId!,
      sender_type: 'ai',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, placeholderMessage]);
    setIsLoading(false);

    // Start streaming
    await streamingService.streamMessage(
      {
        content: messageContent,
        conversation_id: activeConversationId!,
      } as ChatMessage,
      isPublic,
      {
        onStart: () => {
          setIsStreaming(true);
          setStreamingContent('');
        },
        onContent: (chunk: string, fullContent: string) => {
          setStreamingContent(fullContent);
        },
        onComplete: (response: ChatResponse) => {
          setIsStreaming(false);
          setStreamingContent('');
          streamingMessageId.current = null;

          // Replace placeholder with final message
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? {
                  ...msg,
                  content: response.message.content,
                  confidence_score: response.confidence_score,
                  sources: response.sources,
                  isStreaming: false,
                }
              : msg
          ));
        },
        onError: (error: Error) => {
          setIsStreaming(false);
          setStreamingContent('');
          streamingMessageId.current = null;
          
          console.error('Streaming error:', error);
          toast.error('Failed to get response');

          // Replace placeholder with error message
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? {
                  ...msg,
                  content: 'Sorry, I encountered an error. Please try again.',
                  is_error: true,
                  isStreaming: false,
                }
              : msg
          ));
        }
      }
    );
  }, [inputMessage, isLoading, isStreaming, currentConversationId, isPublic, onConversationCreate]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleCopyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied!');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  }, []);

  const handleRateMessage = useCallback(async (messageId: string, rating: 'positive' | 'negative') => {
    try {
      if (isPublic) {
        await apiService.rateMessagePublic(messageId, rating);
      } else {
        await apiService.rateMessage(messageId, rating);
      }
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Failed to rate message');
    }
  }, [isPublic]);

  const handleQuickAction = useCallback((text: string) => {
    setInputMessage(text);
    inputRef.current?.focus();
  }, []);

  // Memoized message components for performance
  const messageComponents = useMemo(() => {
    return messages.map((message, index) => (
      <MessageComponent
        key={message.id}
        message={message}
        onCopy={handleCopyMessage}
        onRate={handleRateMessage}
        isLast={index === messages.length - 1}
        streamingContent={message.id === streamingMessageId.current ? streamingContent : undefined}
        isStreaming={message.id === streamingMessageId.current && isStreaming}
      />
    ));
  }, [messages, handleCopyMessage, handleRateMessage, streamingContent, isStreaming]);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Assistant</h3>
              <p className="text-sm text-slate-500">
                {isStreaming ? 'Responding...' : 'Ready to help'}
              </p>
            </div>
            {isStreaming && (
              <div className="ml-auto flex items-center gap-2 text-blue-600">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
                <span className="text-sm font-medium">Streaming...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Ask me about our programs, courses, or any questions you have about learning with us.
              </p>
              
              {/* Quick start buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                <QuickActionButton 
                  text="Tell me about your programs" 
                  onClick={() => handleQuickAction("Tell me about your programs")}
                />
                <QuickActionButton 
                  text="How do I enroll?" 
                  onClick={() => handleQuickAction("How do I enroll?")}
                />
                <QuickActionButton 
                  text="What are the costs?" 
                  onClick={() => handleQuickAction("What are the costs?")}
                />
              </div>
            </motion.div>
          ) : (
            messageComponents
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px] text-slate-900 placeholder-slate-500"
              rows={1}
              disabled={isLoading || isStreaming}
              style={{ height: '48px' }}
            />
            {inputMessage.trim() && (
              <button
                onClick={handleSendMessage}
                disabled={isLoading || isStreaming}
                className="absolute right-2 bottom-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Quick actions */}
        {!isStreaming && messages.length > 0 && (
          <div className="flex gap-2 mt-3 justify-center flex-wrap">
            <QuickActionButton 
              text="Explain more" 
              onClick={() => handleQuickAction("Can you explain that in more detail?")}
            />
            <QuickActionButton 
              text="Give examples" 
              onClick={() => handleQuickAction("Can you give me some examples?")}
            />
            <QuickActionButton 
              text="What's next?" 
              onClick={() => handleQuickAction("What should I do next?")}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Optimized Message component
const MessageComponent: React.FC<{
  message: Message;
  onCopy: (content: string) => void;
  onRate: (messageId: string, rating: 'positive' | 'negative') => void;
  isLast: boolean;
  streamingContent?: string;
  isStreaming?: boolean;
}> = React.memo(({ message, onCopy, onRate, isLast, streamingContent, isStreaming }) => {
  const isUser = message.sender_type === 'user';
  const isError = message.is_error;
  const content = streamingContent || message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      layout
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
          : isError 
            ? 'bg-red-500'
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex justify-end' : ''}`}>
        {isStreaming && !content ? (
          <TypingIndicator />
        ) : (
          <div className={`rounded-2xl p-4 shadow-sm border ${
            isUser
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-tr-sm'
              : isError
                ? 'bg-red-50 border-red-200 rounded-tl-sm'
                : 'bg-white border-slate-200 rounded-tl-sm'
          }`}>
            {isUser ? (
              <div className="text-white whitespace-pre-wrap">
                {content}
              </div>
            ) : (
              <div className={isError ? 'text-red-700' : 'text-slate-900'}>
                <MarkdownRenderer content={content} />
                {isStreaming && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-blue-500 ml-1"
                  />
                )}
              </div>
            )}
            
            {/* Message actions */}
            {!isUser && !isError && content && !isStreaming && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onCopy(content)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Copy message"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRate(message.id, 'positive')}
                  className="p-1 text-slate-400 hover:text-green-600 transition-colors"
                  title="Good response"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRate(message.id, 'negative')}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Poor response"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
                
                {/* Confidence score */}
                {message.confidence_score && (
                  <div className="ml-auto flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-slate-500">
                      {Math.round(message.confidence_score * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Sources */}
            {message.sources && message.sources.length > 0 && !isStreaming && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Sources:</p>
                <div className="space-y-1">
                  {message.sources.slice(0, 3).map((source, index) => (
                    <div key={index} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                      {source.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

MessageComponent.displayName = 'MessageComponent';

// Quick action button component
const QuickActionButton: React.FC<{
  text: string;
  onClick: () => void;
}> = React.memo(({ text, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-xs bg-white/80 hover:bg-white border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 transition-all duration-200 hover:shadow-sm"
  >
    {text}
  </button>
));

QuickActionButton.displayName = 'QuickActionButton';

export default ModernStreamingChat;