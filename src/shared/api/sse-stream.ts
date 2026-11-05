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
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Retrieve auth token with localStorage fallback
  let token = useAuthStore.getState().token;
  if (!token && typeof window !== 'undefined') {
    try {
      const persisted = localStorage.getItem('insight-hub-auth');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        token = parsed?.state?.token;
      }
    } catch {
      // Ignore
    }
  }

  const cleanPayload: Record<string, string> = {
    question: payload.question.trim(),
  };
  if (payload.conversationId && payload.conversationId.trim()) {
    cleanPayload.conversationId = payload.conversationId.trim();
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/chat/workspaces/${workspaceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(cleanPayload),
        signal,
      }
    );

    if (!response.ok) {
      let errorMsg = `Server returned status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.message) {
          errorMsg = Array.isArray(errorJson.message)
            ? errorJson.message.join(' | ')
            : errorJson.message;
        } else if (errorJson?.error) {
          errorMsg = errorJson.error;
        }
      } catch {
        const text = await response.text();
        if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
          errorMsg = text;
        }
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error('Readable stream not supported by server response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let doneEmitted = false;

    const emitDone = () => {
      if (!doneEmitted) {
        doneEmitted = true;
        callbacks.onDone?.();
      }
    };

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

        const lines = part.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            eventType = trimmed.slice(6).trim();
          } else if (trimmed.startsWith('data:')) {
            dataStr = trimmed.slice(5).trim();
          }
        }

        if (!dataStr && eventType === 'done') {
          emitDone();
          continue;
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === 'start') {
              callbacks.onStart?.(parsed);
            } else if (eventType === 'text') {
              callbacks.onText?.(parsed);
            } else if (eventType === 'metadata') {
              callbacks.onMetadata?.(parsed);
            } else if (eventType === 'done') {
              emitDone();
            }
          } catch {
            if (eventType === 'text') {
              callbacks.onText?.({ text: dataStr });
            }
          }
        }
      }
    }

    emitDone();
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const error = err instanceof Error ? err : new Error(String(err));
    callbacks.onError?.(error);
  }
}
