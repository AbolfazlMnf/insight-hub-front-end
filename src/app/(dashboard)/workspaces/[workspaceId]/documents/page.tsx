'use client';

import React, { use, Suspense } from 'react';
import { DocumentList } from '@/modules/document/components/document-list';

function DocumentsContent({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  return <DocumentList workspaceId={resolvedParams.workspaceId} />;
}

export default function WorkspaceDocumentsPage(props: {
  params: Promise<{ workspaceId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground flex items-center justify-center h-full">
          Loading documents...
        </div>
      }
    >
      <DocumentsContent params={props.params} />
    </Suspense>
  );
}
