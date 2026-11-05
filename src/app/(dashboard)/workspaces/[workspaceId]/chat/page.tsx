'use client';

import React, { use, Suspense } from 'react';
import { ChatInterface } from '@/modules/chat/components/chat-interface';

function ChatContent({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChatInterface workspaceId={resolvedParams.workspaceId} />
    </div>
  );
}

export default function WorkspaceChatPage(props: {
  params: Promise<{ workspaceId: string }>;
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
