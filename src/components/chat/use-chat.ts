'use client';

import { useCallback, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type ChatMode = 'live' | 'demo' | null;

const newId = () => Math.random().toString(36).slice(2);

/**
 * Owns the transcript and the streaming read. Kept apart from the panel so the
 * panel stays a rendering concern and this stays testable on its own.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<ChatMode>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || pending) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const outgoing: ChatMessage = { id: newId(), role: 'user', content: question };
      const replyId = newId();

      // The history sent to the server is the transcript *before* this reply
      // exists, so the empty placeholder below is never part of the request.
      const history = [...messages, outgoing].map(({ role, content }) => ({ role, content }));
      setMessages((prev) => [...prev, outgoing, { id: replyId, role: 'assistant', content: '' }]);
      setPending(true);

      const settle = (content: string) =>
        setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, content } : m)));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        setMode((response.headers.get('X-Chat-Mode') as ChatMode) ?? null);

        if (!response.ok || !response.body) {
          const { error } = await response.json().catch(() => ({ error: null }));
          settle(error ?? 'The assistant is unavailable right now. Please try again.');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          settle(buffer);
        }
        if (!buffer) settle('No answer came back. Please try again.');
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        settle('Could not reach the assistant. Check your connection and try again.');
      } finally {
        setPending(false);
      }
    },
    [messages, pending],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setPending(false);
  }, []);

  return { messages, pending, mode, send, reset };
}
