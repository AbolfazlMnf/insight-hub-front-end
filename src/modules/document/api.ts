import { apiClient } from '@/shared/api/client';
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
    }
  ): Promise<PaginatedDocuments> => {
    // Note: Do NOT send userId in query params; NestJS ValidationPipe with forbidNonWhitelisted: true
    // will reject unwhitelisted properties with 400 Bad Request.
    // User identity is verified via the JWT Bearer token in the Authorization header.
    const cleanParams: Record<string, unknown> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.search) cleanParams.search = params.search;
    if (params?.status) cleanParams.status = params.status;
    if (params?.sortBy) cleanParams.sortBy = params.sortBy;
    if (params?.sortOrder) cleanParams.sortOrder = params.sortOrder;

    const res = await apiClient.get<PaginatedDocuments>(
      `/documents/workspace/${workspaceId}`,
      { params: cleanParams }
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

    // Note: Do NOT append userId to formData; UploadDocumentDto only allows title & file.
    // NestJS verifies membership through the JWT Bearer token.
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
