'use client';

import React, { use, useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '@/modules/workspace/api';
import { useWorkspaceBySlug } from '@/modules/workspace/hooks/use-workspace-by-slug';
import { useAuthStore } from '@/modules/auth/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { getApiErrorMessage } from '@/shared/api/client';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Trash2,
  Loader2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { WorkspaceRole } from '@/modules/workspace/types';

function MembersContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const routeSlug = resolvedParams.slug;

  const { user: currentUser } = useAuthStore();
  const { workspace, workspaceId, isLoading: isWorkspaceLoading, error: workspaceError } =
    useWorkspaceBySlug(routeSlug);

  const [targetUserId, setTargetUserId] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data: members,
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.getMembers(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      workspaceApi.addMember(workspaceId!, {
        targetUserId,
        role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', workspaceId],
      });
      setTargetUserId('');
      setIsAddOpen(false);
      setAddError(null);
      toast.success('Member added successfully.');
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, 'Failed to add member.');
      setAddError(msg);
      toast.error(msg);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userIdToRemove: string) =>
      workspaceApi.removeMember(workspaceId!, userIdToRemove),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', workspaceId],
      });
      toast.success('Member removed.');
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, 'Failed to remove member.');
      toast.error(msg);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (data: { targetUserId: string; role: WorkspaceRole }) =>
      workspaceApi.changeMemberRole(workspaceId!, {
        targetUserId: data.targetUserId,
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', workspaceId],
      });
      toast.success('Member role updated.');
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, 'Failed to update member role.');
      toast.error(msg);
    },
  });

  if (isWorkspaceLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3 text-muted-foreground min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading workspace members...</span>
      </div>
    );
  }

  if (workspaceError || (!isWorkspaceLoading && !workspace)) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">
            Workspace Not Found
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Unable to load members because the workspace was not found or access is restricted.
          </p>
          <Button asChild size="sm">
            <Link href="/" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Return to Workspaces
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin =
    workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members & Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage team access and permissions for {workspace?.name}.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Button
            size="sm"
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {isAddOpen ? 'Cancel' : 'Add Member'}
          </Button>
        )}
      </div>

      {isAddOpen && (
        <Card className="border-primary/40 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Add Workspace Member</CardTitle>
            <CardDescription>
              Assign role privileges to a user by their user ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {addError && (
              <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive mb-4">
                {addError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAddError(null);
                addMemberMutation.mutate();
              }}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="text-xs font-medium block mb-1">
                  User ID (UUID)
                </label>
                <Input
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Role</label>
                <select
                  aria-label="Member role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="MEMBER">MEMBER (Read & Ask Knowledge)</option>
                  {workspace?.role === 'OWNER' && (
                    <option value="ADMIN">ADMIN (Manage docs & members)</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!targetUserId || addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? 'Adding...' : 'Confirm Add'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isMembersLoading ? (
        <div className="flex items-center justify-center p-16 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading members...
        </div>
      ) : membersError ? (
        <div className="p-8 text-center border border-dashed border-border rounded-lg">
          <ShieldAlert className="h-8 w-8 text-destructive mx-auto mb-2 opacity-80" />
          <p className="text-sm font-medium text-destructive">
            {getApiErrorMessage(membersError, 'Failed to load workspace members')}
          </p>
        </div>
      ) : !members || members.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-border rounded-lg">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold">No members found</h3>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  {isOwnerOrAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => {
                  const memberUserId = member.user?.id || member.userId || '';
                  const isCurrent = memberUserId === currentUser?.id;
                  const isOwner = member.role === 'OWNER';

                  return (
                    <tr key={memberUserId || member.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{member.user?.username || member.user?.name || memberUserId.slice(0, 8)}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.user?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            member.role === 'OWNER'
                              ? 'default'
                              : member.role === 'ADMIN'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      {isOwnerOrAdmin && (
                        <td className="px-4 py-3 text-right">
                          {!isOwner && !isCurrent && (
                            <div className="flex items-center justify-end gap-2">
                              {workspace?.role === 'OWNER' && (
                                <select
                                  aria-label="Change member role"
                                  value={member.role}
                                  onChange={(e) =>
                                    changeRoleMutation.mutate({
                                      targetUserId: memberUserId,
                                      role: e.target.value as WorkspaceRole,
                                    })
                                  }
                                  className="h-7 text-xs rounded border border-border bg-background px-2"
                                >
                                  <option value="MEMBER">MEMBER</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeMemberMutation.mutate(memberUserId)
                                }
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title="Remove member"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceMembersPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground flex items-center justify-center h-full">
          Loading members...
        </div>
      }
    >
      <MembersContent params={props.params} />
    </Suspense>
  );
}
