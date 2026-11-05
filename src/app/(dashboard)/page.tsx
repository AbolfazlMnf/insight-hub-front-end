'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '@/modules/workspace/api';
import { useWorkspaceStore } from '@/modules/workspace/store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import Link from 'next/link';
import { Database, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { Workspace } from '@/modules/workspace/types';

export default function WorkspacesListPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { setCurrentWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: () => workspaceApi.getUserWorkspaces({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: () => workspaceApi.createWorkspace({ name, slug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] });
      setName('');
      setSlug('');
      setIsCreating(false);
    },
  });

  const workspaces = data?.data || [];

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select an isolated knowledge workspace or create a new one.
          </p>
        </div>

        <Button onClick={() => setIsCreating(!isCreating)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {isCreating ? 'Cancel' : 'New Workspace'}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary/40 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Create Workspace</CardTitle>
            <CardDescription>
              Workspaces isolate documents, vector embeddings, and conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="text-xs font-medium block mb-1">
                  Workspace Name
                </label>
                <Input
                  placeholder="e.g. Engineering Knowledge"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, '')
                      );
                    }
                  }}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Slug</label>
                <Input
                  placeholder="e.g. engineering-knowledge"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!name || !slug || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading workspaces...
        </div>
      ) : workspaces.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-border rounded-lg">
          <Database className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold">No workspaces found</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create your first workspace to start uploading documents and asking questions.
          </p>
          <Button onClick={() => setIsCreating(true)} size="sm">
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws: Workspace) => (
            <Card
              key={ws.id}
              className="hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    {ws.slug}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{ws.name}</CardTitle>
                <CardDescription className="text-xs">
                  Created {new Date(ws.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setCurrentWorkspace(ws)}
                >
                  <Link href={`/workspaces/${ws.id}`}>
                    <span>Enter Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
