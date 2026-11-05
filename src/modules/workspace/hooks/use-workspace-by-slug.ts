'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api';
import { useWorkspaceStore } from '../store';
import { useAuthStore } from '@/modules/auth/store';
import { Workspace } from '../types';

export function useWorkspaceBySlug(slugOrId: string) {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedInput = useMemo(() => {
    if (!slugOrId) return '';
    try {
      return decodeURIComponent(slugOrId).trim().toLowerCase();
    } catch {
      return slugOrId.trim().toLowerCase();
    }
  }, [slugOrId]);

  const {
    data: workspacesResponse,
    isLoading: isListLoading,
    error: listError,
  } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: () => workspaceApi.getUserWorkspaces({ limit: 100 }),
    enabled: mounted && Boolean(user),
  });

  const matchedWorkspace = useMemo<Workspace | null>(() => {
    if (!normalizedInput) return null;
    const list = workspacesResponse?.data;
    if (!list || list.length === 0) return null;

    return (
      list.find(
        (w) =>
          w.slug.toLowerCase() === normalizedInput ||
          w.id.toLowerCase() === normalizedInput
      ) || null
    );
  }, [workspacesResponse, normalizedInput]);

  // Sync with global workspace store
  useEffect(() => {
    if (matchedWorkspace && currentWorkspace?.id !== matchedWorkspace.id) {
      setCurrentWorkspace(matchedWorkspace);
    }
  }, [matchedWorkspace, currentWorkspace, setCurrentWorkspace]);

  // If current workspace in store matches normalized input, use it as fast fallback
  const fallbackFromStore =
    currentWorkspace &&
    (currentWorkspace.slug.toLowerCase() === normalizedInput ||
      currentWorkspace.id.toLowerCase() === normalizedInput)
      ? currentWorkspace
      : null;

  const resolvedWorkspace = matchedWorkspace || fallbackFromStore;

  // Before mount or while query is loading, preserve loading state consistently
  const isLoading =
    !mounted ||
    isListLoading ||
    (mounted && Boolean(user) && !workspacesResponse && !listError && !resolvedWorkspace);

  return {
    workspace: resolvedWorkspace,
    workspaceId: resolvedWorkspace?.id || null,
    workspaceSlug: resolvedWorkspace?.slug || slugOrId,
    isLoading,
    error: listError,
    isMounted: mounted,
  };
}
