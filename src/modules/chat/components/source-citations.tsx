'use client';

import React, { useState, useMemo } from 'react';
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

  // Group chunks by document so distinct referenced documents are clean and deduplicated
  const groupedSources = useMemo(() => {
    if (!sources || sources.length === 0) return [];
    const map = new Map<string, { title: string; excerpts: string[] }>();

    sources.forEach((src) => {
      const title =
        src.documentTitle || src.title || 'Knowledge Base Document';
      const key = src.documentId || title;

      if (!map.has(key)) {
        map.set(key, { title, excerpts: [] });
      }

      if (src.content && src.content.trim()) {
        const trimmed = src.content.trim();
        const existing = map.get(key)!;
        if (!existing.excerpts.includes(trimmed)) {
          existing.excerpts.push(trimmed);
        }
      }
    });

    return Array.from(map.values());
  }, [sources]);

  if (!sources || sources.length === 0 || groupedSources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-border/60">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
      >
        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>
          {groupedSources.length}{' '}
          {groupedSources.length === 1 ? 'source' : 'sources'} cited
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 transition-transform shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 transition-transform shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2">
          {groupedSources.map((doc, index) => (
            <div
              key={index}
              className="rounded-md border border-border bg-muted/40 p-2.5 text-xs space-y-1.5 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{doc.title}</span>
              </div>

              {doc.excerpts.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  {doc.excerpts.map((excerpt, exIdx) => (
                    <p
                      key={exIdx}
                      className="text-muted-foreground leading-relaxed line-clamp-3 font-normal text-[11px] bg-background/50 p-2 rounded border border-border/40"
                    >
                      {excerpt}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
