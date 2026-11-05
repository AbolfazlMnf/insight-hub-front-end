'use client';

import React, { Suspense } from 'react';
import { Sidebar } from '@/shared/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Suspense
        fallback={
          <aside className="w-64 border-r border-border bg-card flex flex-col h-screen shrink-0 animate-pulse" />
        }
      >
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Suspense
          fallback={
            <div className="p-8 text-sm text-muted-foreground flex items-center justify-center h-full">
              Loading workspace...
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
