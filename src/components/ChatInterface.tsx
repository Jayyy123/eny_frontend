/**
 * Main chat interface component for student conversations
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, AlertCircle, Bot, User, Loader2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { Message, MessageRating } from '../types';
import toast from 'react-hot-toast';

interface ChatInterfaceProps {
  conversationId?: string;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentConversation,
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    rateMessage,
    clearError,
    getSuggestedActions,
    isEscalated,
    getStatusBadgeColor,
  } = useChat(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const message = inputValue.trim();
    setInputValue('');
    sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleRateMessage = (messageId: string, rating: MessageRating) => {
    rateMessage(messageId, rating);
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender_type === 'user';
    const isAI = message.sender_type === 'ai';
    const isAgent = message.sender_type === 'agent';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isUser
                  ? 'bg-primary-600 text-white'
                  : isAI
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                  : 'bg-success-600 text-white'
              }`}
            >
              {isUser ? (
                <User size={16} />
              ) : isAI ? (
                <Bot size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
          </div>

          {/* Message content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div
              className={`px-4 py-2 rounded-lg shadow-sm ${
                isUser
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : isAI
                  ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                  : 'bg-success-50 border border-success-200 text-success-900 rounded-bl-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>

            {/* Message metadata */}
            <div className={`flex items-center mt-1 space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <span className="text-xs text-gray-500">
                {formatMessageTime(message.created_at)}
              </span>
              
              {isAI && message.confidence_score && (
                <span className="text-xs text-gray-400">
                  Confidence: {Math.round(message.confidence_score * 100)}%
                </span>
              )}

              {isAgent && (
                <span className="text-xs text-success-600 font-medium">
                  Agent Response
                </span>
              )}
            </div>

            {/* Rating buttons for AI messages */}
            {isAI && !message.user_rating && (
              <div className="flex items-center mt-2 space-x-1">
                <button
                  onClick={() => handleRateMessage(message.id, 'helpful')}
                  className="p-1 text-gray-400 hover:text-success-600 transition-colors"
                  title="Helpful"
                >
                  <ThumbsUp size={14} />
                </button>
                <button
                  onClick={() => handleRateMessage(message.id, 'not_helpful')}
                  className="p-1 text-gray-400 hover:text-error-600 transition-colors"
                  title="Not helpful"
                >
                  <ThumbsDown size={14} />
                </button>
              </div>
            )}

            {/* Show rating feedback */}
            {message.user_rating && (
              <div className="flex items-center mt-1">
                {message.user_rating === 'helpful' ? (
                  <div className="flex items-center text-success-600 text-xs">
                    <ThumbsUp size={12} className="mr-1" />
                    Thank you for your feedback!
                  </div>
                ) : (
                  <div className="flex items-center text-error-600 text-xs">
                    <ThumbsDown size={12} className="mr-1" />
                    We'll improve our responses.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const suggestedActions = getSuggestedActions();

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentConversation?.title || 'AI Student Support'}
            </h2>
            {currentConversation && (
              <div className="flex items-center mt-1 space-x-2">
                <span className={`badge ${getStatusBadgeColor()}`}>
                  {currentConversation.status}
                </span>
                {isEscalated() && (
                  <div className="flex items-center text-warning-600 text-sm">
                    <AlertCircle size={14} className="mr-1" />
                    Escalated to human agent
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-error-50 border-l-4 border-error-400 p-4 mx-6 mt-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error-400" />
            <div className="ml-3">
              <p className="text-sm text-error-700">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-error-600 hover:text-error-500 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to AI Student Support
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              I'm here to help you with questions about our programs, admissions, payments, and more.
              How can I assist you today?
            </p>
            
            {/* Quick start suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              {[
                'What programs do you offer?',
                'How do I apply?',
                'What are the tuition costs?',
                'When is the next intake?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(renderMessage)}
            
            {/* Typing indicator */}
            {isSending && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
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
        )}
      </div>

      {/* Suggested actions */}
      {suggestedActions.length > 0 && (
        <div className="px-6 py-3 bg-white border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {suggestedActions.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(`Tell me more about ${action.toLowerCase()}`)}
                className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isSending}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
