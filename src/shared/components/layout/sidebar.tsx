'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  FileText,
  MessageSquareCode,
  Users,
  LogOut,
  ChevronRight,
  Database,
  Layers,
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/store';
import { useWorkspaceStore } from '@/modules/workspace/store';
import { workspaceApi } from '@/modules/workspace/api';
import { useUiStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/components/ui/button';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';
import { toast } from 'sonner';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUiStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobileSidebar();
  }, [pathname, closeMobileSidebar]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        closeMobileSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, closeMobileSidebar]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  // Load user workspaces
  const { data: workspacesData } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: () => workspaceApi.getUserWorkspaces({ limit: 50 }),
    enabled: Boolean(user),
  });

  // Extract slug or id from URL path if available
  const urlMatch = pathname?.match(/\/workspaces\/([^/]+)/);
  const routeIdentifier = urlMatch ? urlMatch[1] : null;

  useEffect(() => {
    const list = workspacesData?.data;
    if (list && list.length > 0) {
      if (routeIdentifier && routeIdentifier !== 'default') {
        const found = list.find(
          (w) => w.slug === routeIdentifier || w.id === routeIdentifier
        );
        if (found && currentWorkspace?.id !== found.id) {
          setCurrentWorkspace(found);
        }
      } else if (!currentWorkspace) {
        setCurrentWorkspace(list[0]);
      }
    }
  }, [workspacesData, routeIdentifier, currentWorkspace, setCurrentWorkspace]);

  const activeSlug =
    currentWorkspace?.slug ||
    routeIdentifier ||
    currentWorkspace?.id ||
    null;

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    closeMobileSidebar();
    toast.info('Signed out successfully.');
    router.push('/login');
  };

  const navItems = [
    {
      title: 'Overview',
      href: activeSlug ? `/workspaces/${activeSlug}` : '/',
      icon: FolderKanban,
    },
    {
      title: 'Knowledge Documents',
      href: activeSlug ? `/workspaces/${activeSlug}/documents` : '/',
      icon: FileText,
    },
    {
      title: 'Agentic Assistant',
      href: activeSlug ? `/workspaces/${activeSlug}/chat` : '/',
      icon: MessageSquareCode,
    },
    {
      title: 'Members & Roles',
      href: activeSlug ? `/workspaces/${activeSlug}/members` : '/',
      icon: Users,
    },
  ];

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full w-full">
      {/* Brand Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wide shrink-0">
            IH
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">Insight Hub</span>
            <span className="text-[11px] text-muted-foreground leading-none">
              Workspace Intelligence
            </span>
          </div>
        </div>

        {/* Explicit Close Button on Mobile Drawer */}
        {isMobile && (
          <button
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Close navigation menu"
            className="h-10 w-10 -mr-2 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Active Workspace Selector */}
      <div className="p-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
          <span>Active Workspace</span>
          <Link
            href="/"
            onClick={isMobile ? closeMobileSidebar : undefined}
            className="text-[11px] text-primary hover:underline font-normal flex items-center gap-1 py-1 px-1 -mr-1"
          >
            <Layers className="h-3 w-3" />
            All
          </Link>
        </div>
        <Link
          href="/"
          onClick={isMobile ? closeMobileSidebar : undefined}
          title="Switch Workspace"
          className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background hover:bg-muted/40 transition-colors text-sm group min-h-[44px]"
        >
          <div className="flex items-center gap-2 truncate">
            <Database className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="truncate font-medium text-foreground text-xs sm:text-sm">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={isMobile ? closeMobileSidebar : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between gap-2 mt-auto bg-card">
        <div className="flex flex-col truncate pr-1">
          <span className="text-sm font-medium truncate text-foreground">
            {user?.name || user?.username || 'User'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.email || ''}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            aria-label="Sign out"
            title="Sign Out"
            className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:border-r md:border-border md:bg-card md:flex-col md:h-screen md:shrink-0 md:sticky md:top-0">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Sheet & Backdrop */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            role="dialog"
            aria-label="Mobile Navigation Menu"
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-card shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-250 ease-out"
          >
            {renderContent(true)}
          </aside>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-lg shadow-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-foreground leading-none">
                  Sign Out
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to sign out of Insight Hub? You will need to log in again to access your workspaces.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                className="min-h-[38px] px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmLogout}
                className="gap-1.5 min-h-[38px] px-3 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Confirm Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
