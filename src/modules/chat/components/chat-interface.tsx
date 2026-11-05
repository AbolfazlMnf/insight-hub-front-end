'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Bot,
  User,
  Wrench,
  BookOpen,
  Square,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ChatMessage, AgentMetadata } from '../types';
import { streamWorkspaceChat } from '@/shared/api/sse-stream';

export function ChatInterface({ workspaceId }: { workspaceId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');

    // Append user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'USER',
      content: userText,
      createdAt: new Date().toISOString(),
    };

    // Prepare placeholder assistant message
    const assistantId = crypto.randomUUID();
    const placeholderAssistantMessage: ChatMessage = {
      id: assistantId,
      role: 'ASSISTANT',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, placeholderAssistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';
    let accumulatedMetadata: AgentMetadata | undefined;

    await streamWorkspaceChat(
      workspaceId,
      { question: userText, conversationId },
      {
        onStart: (data) => {
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
        },
        onText: (data) => {
          accumulatedText += data.text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulatedText } : m
            )
          );
        },
        onMetadata: (data) => {
          accumulatedMetadata = data.metadata as AgentMetadata;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, metadata: accumulatedMetadata }
                : m
            )
          );
        },
        onDone: () => {
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        onError: (err) => {
          console.error('Streaming error', err);
          accumulatedText += '\n\n*(Error receiving stream response)*';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulatedText } : m
            )
          );
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
      },
      controller.signal
    );
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    abortControllerRef.current = null;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Agentic Assistant</h2>
          <span className="text-xs text-muted-foreground">
            (RAG & Tool Execution)
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary mb-3">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">How can I assist your team today?</h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1">
              Ask questions across uploaded documents, query vector indexes, or trigger external MCP integrations.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'USER';

            return (
              <div
                key={message.id}
                className={`flex gap-3 text-sm ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-md bg-secondary text-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-card-foreground shadow-sm'
                  }`}
                >
                  {/* Message Content */}
                  <div className="prose dark:prose-invert text-sm max-w-none break-words leading-relaxed">
                    {message.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="animate-pulse text-muted-foreground text-xs">
                        Synthesizing answer...
                      </span>
                    )}
                  </div>

                  {/* Metadata / Tools / Citations */}
                  {message.metadata && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
                      {/* Tool Calls */}
                      {message.metadata.toolsUsed &&
                        message.metadata.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Wrench className="h-3 w-3" /> Tools:
                            </span>
                            {message.metadata.toolsUsed.map((tool, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground"
                              >
                                {tool.name}
                              </span>
                            ))}
                          </div>
                        )}

                      {/* Source Citations */}
                      {message.metadata.sources &&
                        message.metadata.sources.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> Citations:
                            </span>
                            <div className="grid grid-cols-1 gap-1">
                              {message.metadata.sources.map((src, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] rounded bg-muted/50 p-1.5 text-muted-foreground"
                                >
                                  <span className="font-medium text-foreground">
                                    {src.title || 'Referenced Document'}
                                  </span>
                                  {src.content && (
                                    <p className="line-clamp-2 mt-0.5">
                                      {src.content}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder="Ask a question about your workspace..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            className="w-full rounded-md border border-input bg-card px-4 py-2.5 text-sm pr-20 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {isStreaming ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleStop}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <Square className="h-3 w-3" />
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim()}
                className="h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
