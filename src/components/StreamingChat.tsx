/**
 * Streaming chat component with real-time message streaming
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { ChatMessage, Message } from '../types';
import toast from 'react-hot-toast';

interface StreamingChatProps {
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  className?: string;
}

export const StreamingChat: React.FC<StreamingChatProps> = ({
  conversationId,
  onConversationCreated,
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      const conversation = await apiService.getConversation(id);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: currentConversationId || '',
      sender_type: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Try streaming first
      await handleStreamingMessage(messageToSend);
    } catch (error) {
      console.error('Streaming failed, falling back to regular API:', error);
      // Fallback to regular API
      await handleRegularMessage(messageToSend);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleStreamingMessage = async (messageContent: string) => {
    const chatMessage: ChatMessage = {
      content: messageContent,
      conversation_id: currentConversationId,
    };

    try {
      const stream = await apiService.sendStreamingMessage(chatMessage);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'conversation_id' && data.conversation_id) {
                setCurrentConversationId(data.conversation_id);
                onConversationCreated?.(data.conversation_id);
              }
              
              if (data.type === 'message_chunk') {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }
              
              if (data.type === 'message_complete') {
                const aiMessage: Message = {
                  id: data.message_id || Date.now().toString(),
                  conversation_id: data.conversation_id || currentConversationId || '',
                  sender_type: 'ai',
                  content: fullResponse,
                  created_at: new Date().toISOString(),
                  confidence_score: data.confidence_score,
                  metadata: data.metadata,
                };
                
                setMessages(prev => [...prev, aiMessage]);
                setStreamingMessage('');
                fullResponse = '';
              }
              
              if (data.type === 'escalation') {
                toast('Your conversation has been escalated to a human agent', {
                  icon: '⚠️',
                  duration: 5000,
                });
              }
              
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        throw error;
      }
    }
  };

  const handleRegularMessage = async (messageContent: string) => {
    const chatMessage: ChatMessage = {
      content: messageContent,
      conversation_id: currentConversationId,
    };

    const response = await apiService.sendMessage(chatMessage);
    
    if (!currentConversationId) {
      setCurrentConversationId(response.conversation_id);
      onConversationCreated?.(response.conversation_id);
    }

    setMessages(prev => [...prev, response.message]);

    if (response.should_escalate) {
      toast('Your conversation has been escalated to a human agent', {
        icon: '⚠️',
        duration: 5000,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRateMessage = async (messageId: string, rating: 'helpful' | 'not_helpful') => {
    try {
      // Convert old rating format to new format
      const newRating = rating === 'helpful' ? 'positive' : 'negative';
      await apiService.rateMessage(messageId, newRating);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error rating message:', error);
      toast.error('Failed to submit rating');
    }
  };

  const quickActions = [
    { text: 'What programs do you offer?', icon: '🎓' },
    { text: 'How much does it cost?', icon: '💰' },
    { text: 'When can I start?', icon: '📅' },
    { text: 'What are the requirements?', icon: '📋' },
    { text: 'Tell me about career outcomes', icon: '🚀' },
    { text: 'How do I apply?', icon: '📝' },
  ];

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-8">
            <Bot className="w-16 h-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Business Analysis School!
            </h3>
            <p className="text-gray-600 mb-6">
              I'm here to help you with questions about our programs, admissions, and more.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(action.text)}
                  className="flex items-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-sm text-gray-700">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender_type === 'ai' && (
                  <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                )}
                {message.sender_type === 'user' && (
                  <User className="w-4 h-4 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.confidence_score && (
                    <div className="flex items-center mt-1 text-xs opacity-75">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Confidence: {Math.round(message.confidence_score * 100)}%
                    </div>
                  )}
                  
                  {message.sender_type === 'ai' && (
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleRateMessage(message.id, 'helpful')}
                        className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-700"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Helpful</span>
                      </button>
                      <button
                        onClick={() => handleRateMessage(message.id, 'not_helpful')}
                        className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>Not helpful</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-start space-x-2">
                <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                  <div className="flex items-center mt-1 text-xs opacity-75">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse mr-1"></div>
                    <span>AI is typing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
