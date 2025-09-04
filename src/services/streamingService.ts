/**
 * Real-time streaming service for chat messages
 */
import { ChatMessage, ChatResponse } from '../types';

export interface StreamingOptions {
  onStart?: () => void;
  onContent?: (content: string, fullContent: string) => void;
  onComplete?: (response: ChatResponse) => void;
  onError?: (error: Error) => void;
}

export class StreamingService {
  private controller: AbortController | null = null;

  async streamMessage(
    message: ChatMessage,
    isPublic: boolean = false,
    options: StreamingOptions = {}
  ): Promise<void> {
    // Cancel any existing stream
    this.cancel();
    
    this.controller = new AbortController();
    const { onStart, onContent, onComplete, onError } = options;

    try {
      onStart?.();

      if (isPublic) {
        // For public users, simulate streaming with the regular API
        await this.simulateStreaming(message, options);
      } else {
        // For authenticated users, use real streaming
        await this.realTimeStreaming(message, options);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error);
      }
    }
  }

  private async simulateStreaming(
    message: ChatMessage,
    options: StreamingOptions
  ): Promise<void> {
    const { onContent, onComplete, onError } = options;

    try {
      // Use streaming endpoint for public users too
      const apiUrl = process.env.REACT_APP_API_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/streaming/public/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
        signal: this.controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        if (this.controller?.signal.aborted) break;
        
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                fullContent = data.full_content || fullContent + data.content;
                onContent?.(data.content, fullContent);
              } else if (data.type === 'complete') {
                onComplete?.(data.response);
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
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error);
      }
    }
  }

  private async realTimeStreaming(
    message: ChatMessage,
    options: StreamingOptions
  ): Promise<void> {
    const { onContent, onComplete, onError } = options;

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.REACT_APP_API_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/streaming/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(message),
        signal: this.controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        if (this.controller?.signal.aborted) break;
        
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                fullContent += data.content;
                onContent?.(data.content, fullContent);
              } else if (data.type === 'complete') {
                onComplete?.(data.response);
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
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError?.(error);
      }
    }
  }

  cancel(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timeoutId = setTimeout(resolve, ms);
      this.controller?.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        resolve();
      });
    });
  }
}

// Export a singleton instance
export const streamingService = new StreamingService();
