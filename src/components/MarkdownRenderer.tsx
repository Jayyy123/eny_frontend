/**
 * Enhanced markdown renderer for chat messages
 */
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings
          h1: ({ children }: any) => (
            <h1 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              {children}
            </h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-xl font-bold text-slate-800 mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }: any) => (
            <h4 className="text-base font-semibold text-slate-700 mb-2 mt-3">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }: any) => (
            <p className="mb-3 leading-relaxed text-slate-700 last:mb-0">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }: any) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),

          // Links
          a: ({ href, children }: any) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
            >
              {children}
            </a>
          ),

          // Emphasis
          strong: ({ children }: any) => (
            <strong className="font-semibold text-slate-900">
              {children}
            </strong>
          ),
          em: ({ children }: any) => (
            <em className="italic text-slate-700">
              {children}
            </em>
          ),

          // Inline code
          code: ({ inline, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return <>{children}</>;
          },

          // Code blocks
          pre: ({ children, ...props }: any) => {
            const match = /language-(\w+)/.exec(props.className || '');
            const language = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');

            return (
              <div className="relative group mb-4">
                <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 rounded-t-lg">
                  <span className="text-sm font-medium">
                    {language || 'Code'}
                  </span>
                  <button
                    onClick={() => handleCopyCode(code)}
                    className="flex items-center gap-1 text-xs hover:text-white transition-colors"
                  >
                    {copiedCode === code ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={language || 'text'}
                  customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: '0.5rem',
                    borderBottomRightRadius: '0.5rem',
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          },

          // Blockquotes
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 mb-4 italic text-slate-700">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }: any) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-300 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: any) => (
            <thead className="bg-slate-100">
              {children}
            </thead>
          ),
          th: ({ children }: any) => (
            <th className="px-4 py-2 text-left font-semibold text-slate-900 border-b border-slate-300">
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td className="px-4 py-2 text-slate-700 border-b border-slate-200">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-6 border-slate-300" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
