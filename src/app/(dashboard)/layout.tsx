'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/shared/components/layout/sidebar';
import { useAuthStore } from '@/modules/auth/store';
import { useWorkspaceStore } from '@/modules/workspace/store';
import { useUiStore } from '@/shared/stores/ui-store';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { toggleMobileSidebar } = useUiStore();

  useEffect(() => {
    // Check client-side authentication
    const state = useAuthStore.getState();
    if (!state.isAuthenticated || !state.token) {
      router.replace('/login');
    }
  }, [router, isAuthenticated, token]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-background">
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden h-13 border-b border-border bg-card px-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            aria-label="Open navigation menu"
            className="h-10 w-10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 truncate">
            <div className="h-7 w-7 rounded-md overflow-hidden relative shrink-0">
              <Image
                src="/insightHub-optimized.png"
                alt="Insight Hub Logo"
                width={28}
                height={28}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-xs sm:text-sm truncate">
              {currentWorkspace?.name || 'Insight Hub'}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Persistent Sidebar on Desktop & Off-Canvas Drawer on Mobile */}
      <Suspense
        fallback={
          <aside className="hidden md:flex md:w-64 md:border-r md:border-border md:bg-card md:flex-col md:h-screen md:shrink-0 animate-pulse" />
        }
      >
        <Sidebar />
      </Suspense>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100dvh-3.25rem)] md:h-screen overflow-hidden">
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
