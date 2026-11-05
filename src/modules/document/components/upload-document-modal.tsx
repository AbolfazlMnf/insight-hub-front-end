'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface UploadModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDocumentModal({
  workspaceId,
  isOpen,
  onClose,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file || !title) throw new Error('File and title are required');
      return documentApi.uploadDocument({
        file,
        title,
        workspaceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-documents', workspaceId],
      });
      setFile(null);
      setTitle('');
      setError(null);
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-base font-semibold">Upload Knowledge Document</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadMutation.mutate();
          }}
          className="space-y-4 pt-4"
        >
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Document Title
            </label>
            <Input
              type="text"
              placeholder="e.g. Architecture Documentation v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              File (PDF or Plain Text)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  {file ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                      <p className="text-xs text-foreground font-medium">
                        Click to select or drag and drop
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        PDF or TXT up to 25MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) {
                      setFile(selected);
                      if (!title) {
                        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!file || !title || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload & Ingest'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
