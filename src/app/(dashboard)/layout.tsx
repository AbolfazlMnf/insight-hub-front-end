'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/shared/components/layout/sidebar';
import { useAuthStore } from '@/modules/auth/store';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Check client-side authentication
    const state = useAuthStore.getState();
    if (!state.isAuthenticated || !state.token) {
      router.replace('/login');
    } else {
      setIsVerifying(false);
    }
  }, [router, isAuthenticated, token]);

  if (isVerifying && !token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Suspense
        fallback={
          <aside className="w-64 border-r border-border bg-card flex flex-col h-screen shrink-0 animate-pulse" />
        }
      >
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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
