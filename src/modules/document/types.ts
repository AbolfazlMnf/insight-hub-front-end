import { PaginationMeta } from '../workspace/types';

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  workspaceId: string;
  uploadedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStatusResponse {
  status: DocumentStatus;
  id: string;
}

export interface PaginatedDocuments {
  data: DocumentItem[];
  meta: PaginationMeta;
}

export interface UploadDocumentInput {
  file: File;
  title: string;
  workspaceId: string;
}
