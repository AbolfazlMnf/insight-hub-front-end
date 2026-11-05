import { apiClient } from '@/shared/api/client';
import {
  Workspace,
  WorkspaceMember,
  PaginatedResponse,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddMemberInput,
  ChangeRoleInput,
} from './types';

export const workspaceApi = {
  getUserWorkspaces: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Workspace>> => {
    const res = await apiClient.get<PaginatedResponse<Workspace>>('/workspaces', {
      params,
    });
    return res.data;
  },

  getWorkspace: async (id: string): Promise<Workspace> => {
    const res = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return res.data;
  },

  createWorkspace: async (data: CreateWorkspaceInput): Promise<Workspace> => {
    const res = await apiClient.post<Workspace>('/workspaces/create', data);
    return res.data;
  },

  updateWorkspace: async (
    id: string,
    data: UpdateWorkspaceInput
  ): Promise<Workspace> => {
    const res = await apiClient.patch<Workspace>(`/workspaces/${id}`, data);
    return res.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  getMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const res = await apiClient.get<WorkspaceMember[]>(
      `/workspaces/${workspaceId}/members`
    );
    return res.data;
  },

  addMember: async (
    workspaceId: string,
    data: AddMemberInput
  ): Promise<WorkspaceMember> => {
    const res = await apiClient.post<WorkspaceMember>(
      `/workspaces/${workspaceId}/members`,
      data
    );
    return res.data;
  },

  removeMember: async (workspaceId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  changeMemberRole: async (
    workspaceId: string,
    data: ChangeRoleInput
  ): Promise<WorkspaceMember> => {
    const res = await apiClient.patch<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/role`,
      data
    );
    return res.data;
  },
};
