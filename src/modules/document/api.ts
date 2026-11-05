import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/modules/auth/store';
import {
  DocumentItem,
  DocumentStatusResponse,
  PaginatedDocuments,
  UploadDocumentInput,
} from './types';

export const documentApi = {
  getWorkspaceDocuments: async (
    workspaceId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      userId?: string;
    }
  ): Promise<PaginatedDocuments> => {
    const currentUserId = useAuthStore.getState().user?.id;
    const queryParams = {
      ...params,
      ...(currentUserId ? { userId: currentUserId } : {}),
    };

    const res = await apiClient.get<PaginatedDocuments>(
      `/documents/workspace/${workspaceId}`,
      { params: queryParams }
    );
    return res.data;
  },

  getDocument: async (id: string): Promise<DocumentItem> => {
    const res = await apiClient.get<DocumentItem>(`/documents/${id}`);
    return res.data;
  },

  getDocumentStatus: async (id: string): Promise<DocumentStatusResponse> => {
    const res = await apiClient.get<DocumentStatusResponse>(
      `/documents/${id}/status`
    );
    return res.data;
  },

  uploadDocument: async (input: UploadDocumentInput): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('title', input.title);

    const currentUserId = useAuthStore.getState().user?.id;
    if (currentUserId) {
      formData.append('userId', currentUserId);
    }

    const res = await apiClient.post<DocumentItem>(
      `/documents/upload/${input.workspaceId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  retryDocument: async (id: string): Promise<void> => {
    await apiClient.post(`/documents/${id}/retryFailed`);
  },
};
