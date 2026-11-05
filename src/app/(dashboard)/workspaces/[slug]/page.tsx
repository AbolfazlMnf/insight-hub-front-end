"use client";

import React, { use, useState, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { workspaceApi } from "@/modules/workspace/api";
import { documentApi } from "@/modules/document/api";
import { useWorkspaceBySlug } from "@/modules/workspace/hooks/use-workspace-by-slug";
import { useWorkspaceStore } from "@/modules/workspace/store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { getApiErrorMessage } from "@/shared/api/client";
import Link from "next/link";
import {
  FileText,
  MessageSquareCode,
  Users,
  Database,
  ArrowRight,
  Loader2,
  AlertCircle,
  FolderOpen,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";

function OverviewContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const routeSlug = resolvedParams.slug;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCurrentWorkspace } = useWorkspaceStore();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    workspace,
    workspaceId,
    workspaceSlug,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
  } = useWorkspaceBySlug(routeSlug);

  const { data: documentsData, isLoading: isDocsLoading } = useQuery({
    queryKey: ["workspace-documents-summary", workspaceId],
    queryFn: () =>
      documentApi.getWorkspaceDocuments(workspaceId!, {
        limit: 5,
      }),
    enabled: Boolean(workspaceId),
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => workspaceApi.deleteWorkspace(workspaceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-workspaces"] });
      // Reset active workspace
      setCurrentWorkspace(null as any);
      toast.success("Workspace deleted successfully.");
      router.push("/");
    },
    onError: (err: unknown) => {
      const msg = getApiErrorMessage(err, "Failed to delete workspace.");
      toast.error(msg);
    },
  });

  if (isWorkspaceLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3 text-muted-foreground min-h-[350px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Resolving workspace...</span>
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
            The requested workspace could not be found or you do not have
            permission to view it.
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

  const isOwner = workspace?.role === "OWNER";
  const totalDocs = documentsData?.meta?.total || 0;
  const readyDocs =
    documentsData?.data?.filter((d) => d.status === "READY").length || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {workspace?.name || "Workspace Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Knowledge base indexing and AI conversational assistant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href={`/workspaces/${workspaceSlug}/chat`} className="gap-2">
              <MessageSquareCode className="h-4 w-4" />
              Open Assistant
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isDocsLoading ? "..." : totalDocs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {readyDocs} ready for semantic search
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vector Store (Qdrant)
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Connected</div>
            <p className="text-xs text-muted-foreground mt-1">
              Semantic embeddings active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspace?.role || "MEMBER"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Workspace permissions verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <FileText className="h-4 w-4" />
              Knowledge Documents
            </div>
            <CardTitle className="text-base mt-2">
              Manage & Index Files
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Upload PDF and text files. Each document is chunked, embedded with
              AI vectors, and stored in Qdrant for fast semantic retrieval.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/workspaces/${workspaceSlug}/documents`}>
                <span>Manage Documents</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <MessageSquareCode className="h-4 w-4" />
              Agentic Assistant
            </div>
            <CardTitle className="text-base mt-2">Ask Knowledge Base</CardTitle>
            <p className="text-xs text-muted-foreground">
              Query your indexed workspace with streaming responses. The agent
              retrieves relevant chunks and provides answers with exact source
              citations.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/workspaces/${workspaceSlug}/chat`}>
                <span>Start Conversation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone: Delete Workspace for OWNER */}
      {isOwner && (
        <div className="pt-6">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Permanently delete this workspace along with all uploaded
                  documents, chat history, and member access.
                </CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Workspace
              </Button>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-destructive/40 bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-destructive font-semibold text-base">
                <AlertTriangle className="h-5 w-5" />
                Delete Workspace
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground font-semibold">
                {workspace?.name}
              </strong>
              ? This action cannot be undone and will delete all documents and
              conversations.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteWorkspaceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => deleteWorkspaceMutation.mutate()}
                disabled={deleteWorkspaceMutation.isPending}
              >
                {deleteWorkspaceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Confirm Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceOverviewPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground flex items-center justify-center h-full">
          Loading workspace...
        </div>
      }
    >
      <OverviewContent params={props.params} />
    </Suspense>
  );
}
