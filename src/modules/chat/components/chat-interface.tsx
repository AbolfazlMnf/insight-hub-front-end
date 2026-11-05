'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Square,
  Sparkles,
  AlertCircle,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ChatMessage, AgentMetadata } from '../types';
import { streamWorkspaceChat } from '@/shared/api/sse-stream';
import { chatApi, ConversationItem } from '../api';
import { getApiErrorMessage } from '@/shared/api/client';
import { MessageBubble } from './message-bubble';
import { PromptSuggestions } from './prompt-suggestions';
import { toast } from 'sonner';

function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }
  return 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

export function ChatInterface({ workspaceId }: { workspaceId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  const isInvalidWorkspace =
    !workspaceId || workspaceId === 'default' || workspaceId === 'undefined';

  // 1. Fetch workspace conversations list
  const { data: conversations, isLoading: isConversationsLoading } = useQuery({
    queryKey: ['workspace-conversations', workspaceId],
    queryFn: () => chatApi.getWorkspaceConversations(workspaceId),
    enabled: !isInvalidWorkspace,
  });

  // 2. Load conversation messages explicitly when a conversation is chosen
  const loadConversationMessages = useCallback(
    async (convId: string) => {
      if (!convId || !workspaceId) return;
      setIsLoadingDetail(true);
      try {
        const detail = await chatApi.getConversationDetails(convId, workspaceId);
        if (detail?.messages) {
          setMessages(
            detail.messages.map((m) => ({
              id: m.id || safeUUID(),
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load conversation messages', err);
        toast.error('Failed to load conversation history.');
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [workspaceId]
  );

  // 3. Auto-load latest conversation once on mount if available
  useEffect(() => {
    if (
      !hasInitializedRef.current &&
      conversations &&
      conversations.length > 0 &&
      !selectedConversationId
    ) {
      hasInitializedRef.current = true;
      const latest = conversations[0];
      setSelectedConversationId(latest.id);
      loadConversationMessages(latest.id);
    }
  }, [conversations, selectedConversationId, loadConversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isUp);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 4. Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: (convId: string) =>
      chatApi.deleteConversation(convId, workspaceId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-conversations', workspaceId],
      });
      if (selectedConversationId === deletedId) {
        setSelectedConversationId(undefined);
        setMessages([]);
      }
      toast.success('Conversation deleted.');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete conversation'));
    },
  });

  const handleSelectConversation = (convId: string) => {
    if (convId === selectedConversationId) return;
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setSelectedConversationId(convId);
    loadConversationMessages(convId);
  };

  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setSelectedConversationId(undefined);
    setMessages([]);
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isStreaming) return;

    if (!customPrompt) {
      setInput('');
    }

    // Append user message
    const userMessage: ChatMessage = {
      id: safeUUID(),
      role: 'USER',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    // Prepare assistant message placeholder
    const assistantId = safeUUID();
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
    let activeConvId = selectedConversationId;

    await streamWorkspaceChat(
      workspaceId,
      { question: textToSend, conversationId: activeConvId },
      {
        onStart: (data) => {
          if (data.conversationId) {
            activeConvId = data.conversationId;
            setSelectedConversationId(data.conversationId);
          }
        },
        onText: (data) => {
          accumulatedText += data.text || '';
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
        onDone: async () => {
          // If the stream ended without any textual chunks (e.g. backend model performed tool calls
          // but textStream did not yield text for subsequent steps), invoke askWorkspace fallback.
          if (!accumulatedText.trim()) {
            try {
              const res = await chatApi.askWorkspace(workspaceId, {
                question: textToSend,
                conversationId: activeConvId,
              });

              if (res?.conversationId && !activeConvId) {
                activeConvId = res.conversationId;
                setSelectedConversationId(res.conversationId);
              }

              if (res?.answer) {
                accumulatedText = res.answer;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: res.answer,
                          metadata: res.metadata || accumulatedMetadata,
                        }
                      : m
                  )
                );
              }
            } catch (fallbackErr) {
              console.error('Fallback query error:', fallbackErr);
            }
          }

          setIsStreaming(false);
          abortControllerRef.current = null;
          queryClient.invalidateQueries({
            queryKey: ['workspace-conversations', workspaceId],
          });
        },
        onError: async (err) => {
          console.warn('Stream interrupted:', err.message);

          // If no chunks arrived, attempt graceful fallback to non-streaming endpoint
          if (!accumulatedText.trim()) {
            try {
              const res = await chatApi.askWorkspace(workspaceId, {
                question: textToSend,
                conversationId: activeConvId,
              });

              if (res.conversationId) {
                setSelectedConversationId(res.conversationId);
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: res.answer,
                        metadata: res.metadata,
                      }
                    : m
                )
              );
              queryClient.invalidateQueries({
                queryKey: ['workspace-conversations', workspaceId],
              });
              setIsStreaming(false);
              abortControllerRef.current = null;
              return;
            } catch (fallbackErr) {
              const errorText = getApiErrorMessage(fallbackErr, err.message);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: `⚠️ **Unable to complete request:**\n\n${errorText}\n\n*Please ensure your OpenRouter API key and model quota are active in the backend.*`,
                      }
                    : m
                )
              );
              toast.error(errorText);
            }
          } else {
            accumulatedText += `\n\n*(Stream disconnected: ${err.message})*`;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: accumulatedText } : m
              )
            );
          }

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

  if (isInvalidWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-60" />
        <h3 className="text-base font-semibold">No Workspace Selected</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Please select an active workspace to chat with the agent assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Conversations History Sidebar */}
      {isSidebarOpen && (
        <aside className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0 transition-all duration-200">
          <div className="h-14 border-b border-border px-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conversations
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleNewChat}
                className="h-7 px-2 gap-1 text-xs"
                title="Start a new chat"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Close Conversations Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isConversationsLoading ? (
              <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading history...
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No past conversations yet.
              </div>
            ) : (
              conversations.map((conv: ConversationItem) => {
                const isSelected = selectedConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {conv.title || 'Untitled Conversation'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded transition-opacity shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Chat Header */}
        <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Open Conversations Sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
                <span>Conversations</span>
              </Button>
            )}

            {isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-1"
                title="Hide Conversations Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold truncate">
                Agentic Assistant
              </h2>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleNewChat}
            className="text-xs gap-1.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        {/* Messages Scroll Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
        >
          {isLoadingDetail ? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">
                Insight Knowledge Assistant
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
                Ask questions across uploaded documents, query vector indexes,
                or retrieve workspace intelligence with cited sources.
              </p>

              {/* Suggestions */}
              <PromptSuggestions onSelect={(prompt) => handleSend(prompt)} />
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={isStreaming && message.role === 'ASSISTANT'}
                onRetry={
                  message.role === 'ASSISTANT' && message.content?.startsWith('⚠️')
                    ? () => {
                        const lastUser = [...messages]
                          .reverse()
                          .find((m) => m.role === 'USER');
                        if (lastUser) handleSend(lastUser.content);
                      }
                    : undefined
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 z-10 h-8 w-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}

        {/* Input Form with AI Elements styling */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 max-w-4xl mx-auto w-full"
          >
            <div className="flex-1 relative rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring transition-all">
              <textarea
                placeholder="Ask questions about your workspace documents (Shift+Enter for newline)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isStreaming}
                rows={1}
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm focus:outline-hidden disabled:opacity-50 min-h-[42px] max-h-32 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {isStreaming ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleStop}
                className="h-[42px] px-3 gap-1.5 rounded-xl shrink-0"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Stop</span>
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim()}
                className="h-[42px] px-4 gap-1.5 rounded-xl shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
