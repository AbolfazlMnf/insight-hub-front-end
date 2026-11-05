import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { DocumentStatus } from '../types';
import { CheckCircle2, Clock, AlertTriangle, FileUp } from 'lucide-react';

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'READY':
      return (
        <Badge variant="success" className="gap-1 font-normal">
          <CheckCircle2 className="h-3 w-3" />
          Ready
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="warning" className="gap-1 font-normal">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Processing
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className="gap-1 font-normal">
          <AlertTriangle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'UPLOADED':
    default:
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
          <FileUp className="h-3 w-3" />
          Queued
        </Badge>
      );
  }
}
