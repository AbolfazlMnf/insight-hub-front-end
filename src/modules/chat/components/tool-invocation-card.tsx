'use client';

import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export type ToolItem =
  | string
  | {
      name?: string;
      input?: unknown;
      output?: unknown;
    };

function getToolName(tool: ToolItem): string {
  if (typeof tool === 'string') return tool;
  if (tool && typeof tool === 'object' && tool.name) return tool.name;
  return 'Tool';
}

function cleanToolName(name: string): string {
  return name.replace(/^mcp_[^_]+_/, '').replace(/^mcp_/, '');
}

export function ToolInvocationCard({ tools }: { tools: ToolItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!tools || tools.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-border/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
      >
        <Wrench className="h-3 w-3 text-primary shrink-0" />
        <span className="truncate">
          {tools.length} {tools.length === 1 ? 'tool used' : 'tools used'} (
          {tools.map((t) => cleanToolName(getToolName(t))).join(', ')})
        </span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {tools.map((tool, idx) => {
            const rawName = getToolName(tool);
            const isObject = typeof tool === 'object' && tool !== null;
            const input = isObject ? tool.input : undefined;
            const output = isObject ? tool.output : undefined;

            return (
              <div
                key={idx}
                className="rounded-md border border-border bg-muted/30 p-2.5 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {rawName}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-sans">
                    Executed
                  </span>
                </div>

                {input ? (
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Input:
                    </div>
                    <pre className="text-[11px] p-2 rounded bg-background border border-border overflow-x-auto text-foreground font-mono">
                      {typeof input === 'string'
                        ? input
                        : JSON.stringify(input, null, 2)}
                    </pre>
                  </div>
                ) : null}

                {output ? (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Result:
                    </div>
                    <pre className="text-[11px] p-2 rounded bg-background border border-border overflow-x-auto text-foreground font-mono max-h-32">
                      {typeof output === 'string'
                        ? output
                        : JSON.stringify(output, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
