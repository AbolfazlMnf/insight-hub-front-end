'use client';

import React, { use, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '@/modules/workspace/api';
import { documentApi } from '@/modules/document/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';
import { FileText, MessageSquareCode, Users, Database, ArrowRight } from 'lucide-react';

function OverviewContent({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const { data: workspace } = useQuery({
    queryKey: ['workspace-detail', workspaceId],
    queryFn: () => workspaceApi.getWorkspace(workspaceId),
  });

  const { data: documentsData } = useQuery({
    queryKey: ['workspace-documents-summary', workspaceId],
    queryFn: () =>
      documentApi.getWorkspaceDocuments(workspaceId, {
        limit: 5,
      }),
  });

  const totalDocs = documentsData?.meta?.total || 0;
  const readyDocs =
    documentsData?.data?.filter((d) => d.status === 'READY').length || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Slug: {workspace?.slug || 'workspace'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {workspace?.name || 'Workspace Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of knowledge indexed and agent capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href={`/workspaces/${workspaceId}/chat`} className="gap-2">
              <MessageSquareCode className="h-4 w-4" />
              Open Assistant
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {readyDocs} ready for semantic search
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vector Store (Qdrant)</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Connected</div>
            <p className="text-xs text-muted-foreground mt-1">
              Embedded with Vercel AI SDK
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Access</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              Role-Based Access Control enforced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Manage Knowledge Base
            </CardTitle>
            <CardDescription>
              Upload PDF or text documentation, review ingestion status and retry failed chunking jobs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/workspaces/${workspaceId}/documents`}>
                Go to Documents <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareCode className="h-4 w-4" />
              Agentic RAG Assistant
            </CardTitle>
            <CardDescription>
              Ask real-time questions via streaming SSE, query workspace files, and inspect tool operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/workspaces/${workspaceId}/chat`}>
                Launch Chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WorkspaceOverviewPage(props: {
  params: Promise<{ workspaceId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground flex items-center justify-center h-full">
          Loading overview...
        </div>
      }
    >
      <OverviewContent params={props.params} />
    </Suspense>
  );
}
