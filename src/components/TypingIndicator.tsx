/**
 * Enhanced typing indicator with smooth animations
 */
import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  className?: string;
  message?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  className = '',
  message = 'AI is thinking...' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-3 ${className}`}
    >
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      <div className="flex-1 bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-sm text-slate-500">{message}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
