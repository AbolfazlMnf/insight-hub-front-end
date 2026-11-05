'use client';

import React, { use, Suspense } from 'react';
import { useWorkspaceBySlug } from '@/modules/workspace/hooks/use-workspace-by-slug';
import { ChatInterface } from '@/modules/chat/components/chat-interface';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';

function ChatContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const routeSlug = resolvedParams.slug;

  const { workspace, workspaceId, isLoading, error } =
    useWorkspaceBySlug(routeSlug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3 text-muted-foreground min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Connecting to workspace agent...</span>
      </div>
    );
  }

  if (error || (!isLoading && !workspace)) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">
            Workspace Not Found
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Unable to connect to assistant because the workspace was not found or membership is restricted.
          </p>
          <Button asChild size="sm">
            <Link href="/">Back to Workspaces</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <ChatInterface workspaceId={workspaceId!} />
    </div>
  );
}

export default function WorkspaceChatPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground flex items-center justify-center h-full">
          Loading assistant...
        </div>
      }
    >
      <ChatContent params={props.params} />
    </Suspense>
  );
}
