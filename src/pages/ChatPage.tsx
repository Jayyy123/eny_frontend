/**
 * Chat page component
 */
import React from 'react';
import { ChatInterface } from '../components/ChatInterface';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
};
