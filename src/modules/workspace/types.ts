export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  role?: WorkspaceRole;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    name?: string | null;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
}

export interface AddMemberInput {
  userId: string;
  role: WorkspaceRole;
}

export interface ChangeRoleInput {
  userId: string;
  role: WorkspaceRole;
}
