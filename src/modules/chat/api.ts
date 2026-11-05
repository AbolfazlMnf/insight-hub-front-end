import { apiClient } from "@/shared/api/client";
import { AskWorkspacePayload, AgentMetadata } from "./types";

export interface ConversationItem {
  id: string;
  title: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt?: string;
}

export interface ConversationDetail extends ConversationItem {
  messages: ConversationMessage[];
}

export interface ChatResponse {
  answer: string;
  metadata?: AgentMetadata;
  conversationId: string;
}

export const chatApi = {
  getWorkspaceConversations: async (
    workspaceId: string,
  ): Promise<ConversationItem[]> => {
    const res = await apiClient.get<ConversationItem[]>(
      `/conversations/${workspaceId}`,
    );
    return res.data;
  },

  getConversationDetails: async (
    conversationId: string,
    workspaceId: string,
  ): Promise<ConversationDetail> => {
    // Note: Backend route is @Get(':conversationId/:workspaceId')
    const res = await apiClient.get<ConversationDetail>(
      `/conversations/${conversationId}/${workspaceId}`,
    );
    return res.data;
  },

  deleteConversation: async (
    conversationId: string,
    workspaceId: string,
  ): Promise<void> => {
    // Note: Backend route is @Delete(':conversationId/:workspaceId')
    await apiClient.delete(`/conversations/${conversationId}/${workspaceId}`);
  },

  askWorkspace: async (
    workspaceId: string,
    payload: AskWorkspacePayload,
  ): Promise<ChatResponse> => {
    const cleanPayload: Record<string, string> = {
      question: payload.question.trim(),
    };
    if (payload.conversationId?.trim()) {
      cleanPayload.conversationId = payload.conversationId.trim();
    }

    const res = await apiClient.post<ChatResponse>(
      `/chat/workspaces/${workspaceId}`,
      cleanPayload,
    );
    return res.data;
  },
};
