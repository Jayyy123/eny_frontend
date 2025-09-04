/**
 * Enhanced toast service with deduplication and custom styling
 */
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import React from 'react';

interface ToastOptions {
  id?: string;
  duration?: number;
  deduplication?: boolean;
}

class ToastService {
  private activeToasts = new Set<string>();
  private toastTimeouts = new Map<string, NodeJS.Timeout>();

  private generateId(message: string, type: string): string {
    return `${type}-${message.slice(0, 50).replace(/\s+/g, '-')}`;
  }

  private createCustomToast(message: string, type: 'success' | 'error' | 'info' | 'loading', options?: ToastOptions) {
    const id = options?.id || this.generateId(message, type);
    
    // Check for deduplication
    if (options?.deduplication !== false && this.activeToasts.has(id)) {
      return id; // Return existing toast ID
    }

    // Clear any existing timeout for this toast
    const existingTimeout = this.toastTimeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    this.activeToasts.add(id);

    const toastResult = toast.custom(
      (t) => (
        React.createElement('div', {
          className: `flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 ${
            t.visible ? 'animate-enter' : 'animate-leave'
          } ${
            type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            type === 'loading' ? 'bg-blue-50 border-blue-200 text-blue-800' :
            'bg-gray-50 border-gray-200 text-gray-800'
          }`,
          style: { maxWidth: '400px' }
        }, [
          // Icon
          React.createElement('div', {
            key: 'icon',
            className: 'flex-shrink-0 mt-0.5'
          }, [
            type === 'success' && React.createElement('div', {
              key: 'success-icon',
              className: 'w-5 h-5 rounded-full bg-green-500 flex items-center justify-center'
            }, '✓'),
            type === 'error' && React.createElement('div', {
              key: 'error-icon', 
              className: 'w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs'
            }, '!'),
            type === 'loading' && React.createElement('div', {
              key: 'loading-icon',
              className: 'w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'
            }),
            type === 'info' && React.createElement('div', {
              key: 'info-icon',
              className: 'w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs'
            }, 'i')
          ]),
          
          // Message
          React.createElement('div', {
            key: 'message',
            className: 'flex-1 text-sm font-medium'
          }, message),
          
          // Close button
          React.createElement('button', {
            key: 'close',
            onClick: () => {
              toast.dismiss(t.id);
              this.activeToasts.delete(id);
              const timeout = this.toastTimeouts.get(id);
              if (timeout) {
                clearTimeout(timeout);
                this.toastTimeouts.delete(id);
              }
            },
            className: `flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors ${
              type === 'success' ? 'text-green-600 hover:bg-green-200' :
              type === 'error' ? 'text-red-600 hover:bg-red-200' :
              type === 'loading' ? 'text-blue-600 hover:bg-blue-200' :
              'text-gray-600 hover:bg-gray-200'
            }`
          }, React.createElement(X, { className: 'w-4 h-4' }))
        ])
      ),
      {
        id,
        duration: options?.duration || (type === 'loading' ? Infinity : type === 'error' ? 6000 : 4000),
      }
    );

    // Set timeout to remove from active toasts
    if (type !== 'loading') {
      const timeout = setTimeout(() => {
        this.activeToasts.delete(id);
        this.toastTimeouts.delete(id);
      }, options?.duration || (type === 'error' ? 6000 : 4000));
      
      this.toastTimeouts.set(id, timeout);
    }

    return toastResult;
  }

  success(message: string, options?: ToastOptions) {
    return this.createCustomToast(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    return this.createCustomToast(message, 'error', options);
  }

  info(message: string, options?: ToastOptions) {
    return this.createCustomToast(message, 'info', options);
  }

  loading(message: string, options?: ToastOptions) {
    return this.createCustomToast(message, 'loading', options);
  }

  // Simple methods that use react-hot-toast directly for backward compatibility
  simpleSuccess(message: string) {
    return toast.success(message);
  }

  simpleError(message: string) {
    return toast.error(message);
  }

  dismiss(toastId?: string) {
    if (toastId) {
      toast.dismiss(toastId);
      // Clean up tracking
      const timeout = this.toastTimeouts.get(toastId);
      if (timeout) {
        clearTimeout(timeout);
        this.toastTimeouts.delete(toastId);
        this.activeToasts.delete(toastId);
      }
    } else {
      toast.dismiss();
      this.activeToasts.clear();
      this.toastTimeouts.forEach(timeout => clearTimeout(timeout));
      this.toastTimeouts.clear();
    }
  }

  // Welcome back message with deduplication
  welcomeBack(userName?: string) {
    const message = userName ? `Welcome back, ${userName}!` : 'Welcome back!';
    return this.success(message, {
      id: 'welcome-back',
      duration: 3000,
      deduplication: true
    });
  }

  // Connection status messages
  connectionRestored() {
    return this.success('Connection restored', {
      id: 'connection-restored',
      duration: 2000,
      deduplication: true
    });
  }

  connectionLost() {
    return this.error('Connection lost. Trying to reconnect...', {
      id: 'connection-lost',
      duration: Infinity,
      deduplication: true
    });
  }
}

export const toastService = new ToastService();
