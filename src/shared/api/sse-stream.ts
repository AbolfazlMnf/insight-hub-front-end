import { useAuthStore } from '@/modules/auth/store';

export interface SSECallbacks {
  onStart?: (data: { conversationId: string }) => void;
  onText?: (data: { text: string }) => void;
  onMetadata?: (data: { metadata: Record<string, unknown> }) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function streamWorkspaceChat(
  workspaceId: string,
  payload: { question: string; conversationId?: string },
  callbacks: SSECallbacks,
  signal?: AbortSignal
) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const token = useAuthStore.getState().token;

  try {
    const response = await fetch(
      `${API_BASE_URL}/chat/workspaces/${workspaceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Stream request failed (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = 'message';
        let dataStr = '';

        const lines = part.split('\n');
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataStr = line.slice(5).trim();
          }
        }

        try {
          const parsed = dataStr ? JSON.parse(dataStr) : {};
          if (eventType === 'start') {
            callbacks.onStart?.(parsed);
          } else if (eventType === 'text') {
            callbacks.onText?.(parsed);
          } else if (eventType === 'metadata') {
            callbacks.onMetadata?.(parsed);
          } else if (eventType === 'done') {
            callbacks.onDone?.();
          }
        } catch (parseErr) {
          console.warn('Failed to parse SSE event data', lineData(part), parseErr);
        }
      }
    }

    callbacks.onDone?.();
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const error = err instanceof Error ? err : new Error(String(err));
    callbacks.onError?.(error);
  }
}

function lineData(raw: string) {
  return raw.replace(/\r?\n/g, ' ');
}
