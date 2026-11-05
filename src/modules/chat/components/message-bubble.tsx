'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Copy,
  Check,
  RotateCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ChatMessage } from '../types';
import { SourceCitations } from './source-citations';
import { ToolInvocationCard } from './tool-invocation-card';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export function MessageBubble({
  message,
  isStreaming = false,
  onRetry,
}: MessageBubbleProps) {
  const isUser = message.role === 'USER';
  const isError = message.content?.startsWith('⚠️');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex gap-3 text-sm transition-all ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
            isError
              ? 'bg-destructive/10 text-destructive border-destructive/30'
              : 'bg-primary/10 text-primary border-primary/20'
          }`}
        >
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`relative max-w-[85%] rounded-xl px-4 py-3 transition-colors ${
          isUser
            ? 'bg-primary text-primary-foreground shadow-xs'
            : isError
            ? 'bg-destructive/5 border border-destructive/30 text-foreground shadow-xs'
            : 'bg-card border border-border text-card-foreground shadow-xs'
        }`}
      >
        {/* Header / Author */}
        <div className="flex items-center justify-between gap-4 mb-1 text-[11px] font-medium opacity-70">
          <span>{isUser ? 'You' : 'Insight Agent'}</span>
          {message.createdAt && (
            <span className="text-[10px] tabular-nums font-mono">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="prose dark:prose-invert text-sm max-w-none break-words leading-relaxed">
          {message.content ? (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <div className="relative my-2 rounded-lg border border-border bg-muted/60 overflow-hidden font-mono text-xs">
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/80 text-[11px] text-muted-foreground">
                            <span>{match[1]}</span>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(codeText)}
                              className="hover:text-foreground flex items-center gap-1 transition-colors"
                              title="Copy code"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="p-3 overflow-x-auto text-foreground">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded text-[12px] font-mono border border-border/50 text-foreground"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Live Streaming Cursor */}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
              )}
            </>
          ) : isStreaming ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>
                {message.metadata?.toolsUsed && (message.metadata.toolsUsed as any[]).length > 0
                  ? 'Synthesizing final answer from retrieved tools...'
                  : 'Analyzing knowledge base and drafting answer...'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic py-1">
              Response generation completed. No additional text was emitted.
            </div>
          )}
        </div>

        {/* Tools Invocations Card */}
        {message.metadata?.toolsUsed && (
          <ToolInvocationCard tools={message.metadata.toolsUsed as any} />
        )}

        {/* Source Citations */}
        {message.metadata?.sources && (
          <SourceCitations sources={message.metadata.sources as any} />
        )}

        {/* Actions Toolbar for Assistant */}
        {!isUser && message.content && (
          <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                className="h-7 px-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-[11px] transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="h-7 px-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-[11px] transition-colors"
                  title="Regenerate response"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>

            {isError && (
              <span className="text-[11px] text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Execution issue
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
