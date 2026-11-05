'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api';
import { DocumentStatusBadge } from './document-status-badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  FileText,
  Search,
  RotateCw,
  Trash2,
  Plus,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { UploadDocumentModal } from './upload-document-modal';

export function DocumentList({ workspaceId }: { workspaceId: string }) {
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const queryClient = useQueryClient();

  // Query documents with automatic background polling if any document is processing
  const { data, isLoading, error } = useQuery({
    queryKey: ['workspace-documents', workspaceId, search],
    queryFn: () =>
      documentApi.getWorkspaceDocuments(workspaceId, {
        search: search || undefined,
        limit: 50,
      }),
    refetchInterval: (query) => {
      const docs = query.state.data?.data;
      const hasActive = docs?.some(
        (d) => d.status === 'PROCESSING' || d.status === 'UPLOADED'
      );
      return hasActive ? 3000 : false;
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => documentApi.retryDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-documents', workspaceId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-documents', workspaceId],
      });
    },
  });

  const documents = data?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Knowledge Documents
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Documents indexed and embedded into the workspace vector store.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading workspace documents...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load documents. Make sure the backend server is running.
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <HardDrive className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
            <h3 className="text-sm font-semibold">No documents uploaded yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Add your product specs, manuals, or PDF documentation so the AI agent can query internal knowledge.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload First Document
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4 font-medium">Document</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Size</th>
                <th className="py-3 px-4 font-medium">Added</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="truncate max-w-[280px]">
                      <span className="block truncate">{doc.title}</span>
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {doc.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <DocumentStatusBadge status={doc.status} />
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {(doc.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {doc.status === 'FAILED' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Retry Ingestion"
                          onClick={() => retryMutation.mutate(doc.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RotateCw className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete Document"
                        onClick={() => {
                          if (confirm('Delete this document from the vector store?')) {
                            deleteMutation.mutate(doc.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UploadDocumentModal
        workspaceId={workspaceId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
