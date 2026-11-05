'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  'Summarize the indexed documents in this workspace',
  'What are the key technical architectural decisions?',
  'Find documentation regarding authentication and APIs',
  'What prerequisites are needed to run and deploy this project?',
];

export function PromptSuggestions({ onSelect }: PromptSuggestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Workspace Prompts</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {DEFAULT_SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="text-left text-xs p-3 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/40 text-foreground transition-all duration-150 shadow-2xs group flex flex-col justify-between"
          >
            <span className="font-medium group-hover:text-primary transition-colors">
              {prompt}
            </span>
            <span className="text-[10px] text-muted-foreground mt-2 block">
              Ask AI Agent &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
