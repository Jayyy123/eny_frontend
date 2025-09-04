import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Message, ChatResponse } from '../types';
import { apiService } from '../services/api';

interface OptimizedChatProps {
  conversationId?: string;
  onConversationCreate?: (id: string) => void;
  isPublic?: boolean;
  showPerformanceMetrics?: boolean;
}

interface StreamingChunk {
  type: 'partial' | 'streaming' | 'complete' | 'error';
  content?: string;
  partial_response?: string;
  confidence?: number;
  suggestions?: string[];
  final?: boolean;
  error?: string;
}

export const OptimizedChat: React.FC<OptimizedChatProps> = ({
  conversationId,
  onConversationCreate,
  isPublic = false,
  showPerformanceMetrics = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [useStreaming, setUseStreaming] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number>(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleQuickAction = useCallback(async (actionText: string) => {
    setInputMessage(actionText);
    await sendMessage(actionText);
  }, []);

  const sendMessageFast = async (content: string) => {
    startTimeRef.current = Date.now();
    
    try {
      const baseUrl = process.env.REACT_APP_STREAMING_URL || '/api/v1/streaming';
      const endpoint = isPublic ? `${baseUrl}/public/chat/fast` : `${baseUrl}/chat/fast`;
      
      const response = await apiService.post<ChatResponse>(endpoint, {
        content,
        conversation_id: currentConversationId
      });

      const endTime = Date.now();
      const responseTimeMs = endTime - startTimeRef.current;
      setResponseTime(responseTimeMs);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        conversation_id: response.conversation_id,
        sender_type: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversation_id: response.conversation_id,
        sender_type: 'ai',
        content: response.message.content,
        created_at: new Date().toISOString(),
        confidence_score: response.message.confidence_score,
        metadata: response.metadata
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      // Update suggestions
      if (response.suggested_actions) {
        setSuggestions(response.suggested_actions);
      }

      // Update conversation ID if needed
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        onConversationCreate?.(response.conversation_id);
      }

      // Show performance toast if enabled
      if (showPerformanceMetrics) {
        const responseType = response.metadata?.response_type || 'unknown';
        toast(`Response in ${responseTimeMs}ms (${responseType})`, { 
          icon: responseTimeMs < 1000 ? '⚡' : responseTimeMs < 3000 ? '✅' : '⏰',
          duration: 2000 
        });
      }

      return response;

    } catch (error) {
      console.error('Error sending fast message:', error);
      throw error;
    }
  };

  const sendMessageStreaming = async (content: string) => {
    startTimeRef.current = Date.now();
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        conversation_id: currentConversationId || 'temp',
        sender_type: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Setup streaming
      const baseUrl = process.env.REACT_APP_STREAMING_URL || '/api/v1/streaming';
      const endpoint = isPublic 
        ? `${baseUrl}/public/chat/stream`
        : `${baseUrl}/chat/stream`;

      const eventSource = new EventSource(endpoint);
      eventSourceRef.current = eventSource;

      // Send the message data
      await apiService.post(endpoint.replace('/stream', ''), {
        content,
        conversation_id: currentConversationId
      });

      eventSource.onmessage = (event) => {
        try {
          const chunk: StreamingChunk = JSON.parse(event.data);
          
          if (chunk.type === 'streaming' && chunk.content) {
            setStreamingContent(prev => prev + chunk.content);
          } else if (chunk.type === 'partial' && chunk.content) {
            setStreamingContent(chunk.content);
            if (chunk.suggestions) {
              setSuggestions(chunk.suggestions);
            }
          } else if (chunk.type === 'complete') {
            // Finalize streaming
            const endTime = Date.now();
            setResponseTime(endTime - startTimeRef.current);
            
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              conversation_id: currentConversationId || 'temp',
              sender_type: 'ai',
              content: streamingContent,
              created_at: new Date().toISOString(),
              confidence_score: chunk.confidence || 0.8
            };

            setMessages(prev => [...prev, aiMessage]);
            setStreamingContent('');
            setIsStreaming(false);
            
            if (chunk.suggestions) {
              setSuggestions(chunk.suggestions);
            }

            eventSource.close();
            eventSourceRef.current = null;

            if (showPerformanceMetrics) {
              toast(`Streamed response completed in ${endTime - startTimeRef.current}ms`, { 
                icon: '🚀',
                duration: 2000 
              });
            }
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error || 'Streaming error');
          }
        } catch (error) {
          console.error('Error parsing streaming chunk:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Streaming error:', error);
        setIsStreaming(false);
        setStreamingContent('');
        eventSource.close();
        eventSourceRef.current = null;
        throw new Error('Streaming connection failed');
      };

    } catch (error) {
      setIsStreaming(false);
      setStreamingContent('');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      throw error;
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent || isLoading || isStreaming) return;

    setIsLoading(true);
    setInputMessage('');

    try {
      if (useStreaming) {
        await sendMessageStreaming(messageContent);
      } else {
        await sendMessageFast(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header with Performance Toggle */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {isPublic ? 'Ask About Our Programs' : 'Chat Assistant'}
            </h2>
            <p className="text-sm text-gray-600">
              Get instant answers about our Business Analysis programs
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {showPerformanceMetrics && responseTime && (
              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {responseTime}ms
              </div>
            )}
            <button
              onClick={() => setUseStreaming(!useStreaming)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                useStreaming
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{useStreaming ? 'Streaming' : 'Fast'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.confidence_score && showPerformanceMetrics && (
                <div className="text-xs mt-1 opacity-70">
                  Confidence: {Math.round(message.confidence_score * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
              <p className="text-sm">{streamingContent}</p>
              <div className="flex items-center mt-2">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                <span className="text-xs text-gray-500">Streaming...</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(suggestion)}
                disabled={isLoading || isStreaming}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about programs, costs, careers..."
            disabled={isLoading || isStreaming}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || isStreaming}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {showPerformanceMetrics && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Mode: {useStreaming ? 'Streaming (real-time)' : 'Fast (cached)'} • 
            {responseTime ? ` Last response: ${responseTime}ms` : ' Ready'}
          </div>
        )}
      </form>
    </div>
  );
};
