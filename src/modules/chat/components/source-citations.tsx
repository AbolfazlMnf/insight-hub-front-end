'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export interface SourceItem {
  documentId?: string;
  chunkId?: string;
  documentTitle?: string;
  chunkIndex?: number;
  score?: number;
  title?: string;
  content?: string;
}

export function SourceCitations({ sources }: { sources: SourceItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-border/60">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
      >
        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>
          {sources.length} {sources.length === 1 ? 'source' : 'sources'} cited
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 transition-transform shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 transition-transform shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2">
          {sources.map((src, index) => {
            const displayTitle =
              src.documentTitle || src.title || 'Knowledge Base Document';

            return (
              <div
                key={src.chunkId || index}
                className="rounded-md border border-border bg-muted/40 p-2.5 text-xs space-y-1.5 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center justify-between gap-2 font-medium text-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{displayTitle}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {typeof src.chunkIndex === 'number' && (
                      <span className="text-[10px] text-muted-foreground font-mono bg-background/80 border border-border px-1.5 py-0.5 rounded">
                        Chunk #{src.chunkIndex + 1}
                      </span>
                    )}
                    {typeof src.score === 'number' && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-background/80 border border-border px-1.5 py-0.5 rounded">
                        Score: {(src.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {src.content && (
                  <p className="text-muted-foreground leading-relaxed line-clamp-3 font-normal text-[11px] bg-background/50 p-2 rounded border border-border/40">
                    {src.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
