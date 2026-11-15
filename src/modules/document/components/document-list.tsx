'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { UploadDocumentModal } from './upload-document-modal';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/api/client';

export function DocumentList({ workspaceId }: { workspaceId: string }) {
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const queryClient = useQueryClient();

  const isInvalidWorkspace =
    !workspaceId || workspaceId === 'default' || workspaceId === 'undefined';

  // Query documents with automatic background polling if any document is processing
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workspace-documents', workspaceId, search],
    queryFn: () =>
      documentApi.getWorkspaceDocuments(workspaceId, {
        search: search || undefined,
        limit: 50,
      }),
    enabled: !isInvalidWorkspace,
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
      toast.success('Document re-processing request sent.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Failed to retry document processing.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-documents', workspaceId],
      });
      toast.success('Document deleted successfully.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Failed to delete document.'));
    },
  });

  if (isInvalidWorkspace) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <FolderOpen className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold">No Workspace Selected</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
          Please select an active workspace to view and upload knowledge documents.
        </p>
        <Button asChild>
          <Link href="/">Select or Create Workspace</Link>
        </Button>
      </div>
    );
  }

  const documents = data?.data || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Knowledge Documents
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Documents parsed and indexed into the vector database for RAG querying.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          size="sm"
          className="gap-2 w-full sm:w-auto min-h-[44px] shrink-0"
        >
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>
      </div>

      {/* Table & Cards Area */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 sm:p-16 text-sm text-muted-foreground gap-2.5">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading documents...
          </div>
        ) : error ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Unable to load documents
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              {getApiErrorMessage(error, 'Failed to fetch documents for this workspace.')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2 min-h-[44px]"
            >
              Try Again
            </Button>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 sm:p-16 text-center flex flex-col items-center">
            <HardDrive className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
            <h3 className="text-sm font-semibold">No documents uploaded yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1 mb-5">
              Upload product specs, guidelines, or PDF documentation so the assistant can cite internal knowledge.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="gap-1.5 min-h-[44px]"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload First Document
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile View: Document Cards */}
            <div className="md:hidden divide-y divide-border">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="block font-medium text-sm text-foreground truncate">
                          {doc.title}
                        </span>
                        <span className="text-xs text-muted-foreground block truncate">
                          {doc.fileName}
                        </span>
                      </div>
                    </div>
                    <DocumentStatusBadge status={doc.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {doc.status === 'FAILED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          title="Retry Ingestion"
                          aria-label="Retry Ingestion"
                          onClick={() => retryMutation.mutate(doc.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RotateCw className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                        title="Delete Document"
                        aria-label="Delete Document"
                        onClick={() => {
                          if (
                            confirm(
                              'Are you sure you want to delete this document from the vector store?'
                            )
                          ) {
                            deleteMutation.mutate(doc.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
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
                          <span className="block truncate font-medium text-foreground">
                            {doc.title}
                          </span>
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
                              className="h-8 w-8"
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
                            className="h-8 w-8"
                            title="Delete Document"
                            onClick={() => {
                              if (
                                confirm(
                                  'Are you sure you want to delete this document from the vector store?'
                                )
                              ) {
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
            </div>
          </>
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
