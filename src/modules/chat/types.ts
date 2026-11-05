export type MessageRole = 'USER' | 'ASSISTANT';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
  metadata?: AgentMetadata;
}

export interface AgentMetadata {
  toolsUsed?: Array<{
    name: string;
    input?: unknown;
    output?: unknown;
  }>;
  sources?: Array<{
    title?: string;
    content?: string;
    score?: number;
    documentId?: string;
  }>;
  [key: string]: unknown;
}

export interface AskWorkspacePayload {
  question: string;
  conversationId?: string;
}
