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

// Helper to normalize backend workspace responses (which might wrap workspace inside WorkspaceMember)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWorkspace(item: any): Workspace {
  if (item && item.workspace) {
    return {
      id: item.workspace.id,
      name: item.workspace.name,
      slug: item.workspace.slug,
      createdAt: item.workspace.createdAt || item.createdAt,
      updatedAt: item.workspace.updatedAt || item.updatedAt,
      role: item.role,
    };
  }
  return item;
}

export const workspaceApi = {
  getUserWorkspaces: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Workspace>> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<PaginatedResponse<any>>('/workspaces', {
      params,
    });
    return {
      data: (res.data.data || []).map(normalizeWorkspace),
      meta: res.data.meta,
    };
  },

  getWorkspace: async (id: string): Promise<Workspace> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>(`/workspaces/${id}`);
    return normalizeWorkspace(res.data);
  },

  createWorkspace: async (data: CreateWorkspaceInput): Promise<Workspace> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.post<any>('/workspaces/create', data);
    return normalizeWorkspace(res.data);
  },

  updateWorkspace: async (
    id: string,
    data: UpdateWorkspaceInput
  ): Promise<Workspace> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.patch<any>(`/workspaces/${id}`, data);
    return normalizeWorkspace(res.data);
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

  removeMember: async (
    workspaceId: string,
    targetUserId: string
  ): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/members`, {
      data: { targetUserId },
    });
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
