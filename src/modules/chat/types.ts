export type MessageRole = 'USER' | 'ASSISTANT';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
  metadata?: AgentMetadata;
}

export interface AgentSource {
  documentId: string;
  chunkId: string;
  documentTitle?: string;
  chunkIndex?: number;
  score?: number;
  title?: string;
  content?: string;
}

export interface AgentMetadata {
  toolsUsed?: Array<string | { name?: string; input?: unknown; output?: unknown }>;
  sources?: AgentSource[];
  [key: string]: unknown;
}

export interface AskWorkspacePayload {
  question: string;
  conversationId?: string;
}
