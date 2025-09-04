/**
 * Chat Loading Skeleton Component
 */
import React from 'react';

interface ChatSkeletonProps {
  className?: string;
}

export const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse space-y-4 p-4 ${className}`}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded"></div>
      </div>

      {/* Message Skeletons */}
      <div className="space-y-4">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="max-w-xs lg:max-w-md">
            <div className="bg-gray-200 rounded-lg p-3 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="flex justify-end mt-1">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* AI Message */}
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md">
            <div className="bg-gray-200 rounded-lg p-3 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
            <div className="flex justify-start mt-1">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end">
          <div className="max-w-xs lg:max-w-md">
            <div className="bg-gray-200 rounded-lg p-3 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
            <div className="flex justify-end mt-1">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* AI Message */}
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-md">
            <div className="bg-gray-200 rounded-lg p-3 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-4/5"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="flex justify-start mt-1 space-x-2">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="border-t pt-4 mt-6">
        <div className="flex items-end space-x-2">
          <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const ConversationListSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
