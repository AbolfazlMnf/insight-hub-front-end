'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/store';
import { useWorkspaceStore } from '@/modules/workspace/store';
import { workspaceApi } from '@/modules/workspace/api';
import { toast } from 'sonner';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

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

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-2.5">
        <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wide">
          IH
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-tight">Insight Hub</span>
          <span className="text-[11px] text-muted-foreground leading-none">
            Workspace Intelligence
          </span>
        </div>
      </div>

      {/* Active Workspace Pill / Selector Link */}
      <div className="p-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
          <span>Active Workspace</span>
          <Link
            href="/"
            className="text-[10px] text-primary hover:underline font-normal flex items-center gap-1"
          >
            <Layers className="h-3 w-3" />
            All
          </Link>
        </div>
        <Link
          href="/"
          title="Switch Workspace"
          className="flex items-center justify-between px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted/40 transition-colors text-sm group"
        >
          <div className="flex items-center gap-2 truncate">
            <Database className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="truncate font-medium text-foreground">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground font-semibold'
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
      <div className="p-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex flex-col truncate">
          <span className="text-sm font-medium truncate text-foreground">
            {user?.name || user?.username || 'User'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.email || ''}
          </span>
        </div>
        <button
          onClick={() => {
            logout();
            toast.info('Signed out successfully.');
          }}
          title="Sign Out"
          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
