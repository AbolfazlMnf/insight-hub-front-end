'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderKanban,
  FileText,
  MessageSquareCode,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/store';
import { useWorkspaceStore } from '@/modules/workspace/store';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  const workspaceId = currentWorkspace?.id || 'default';

  const navItems = [
    {
      title: 'Overview',
      href: `/workspaces/${workspaceId}`,
      icon: FolderKanban,
    },
    {
      title: 'Knowledge Documents',
      href: `/workspaces/${workspaceId}/documents`,
      icon: FileText,
    },
    {
      title: 'Agentic Chat & RAG',
      href: `/workspaces/${workspaceId}/chat`,
      icon: MessageSquareCode,
    },
    {
      title: 'Members & Roles',
      href: `/workspaces/${workspaceId}/members`,
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

      {/* Active Workspace Pill */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1 px-1">
          Active Workspace
        </div>
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md border border-border bg-background text-sm">
          <div className="flex items-center gap-2 truncate">
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate font-medium">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
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
          <span className="text-sm font-medium truncate">
            {user?.name || user?.username || 'User'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.email || ''}
          </span>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
