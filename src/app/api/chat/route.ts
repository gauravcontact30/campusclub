import Anthropic from '@anthropic-ai/sdk';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { CHAT_TOOLS } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { demoAnswer } from '@/lib/ai/fallback';
import { withLogging } from '@/lib/admin/with-logging';

/** Tools hit the data layer, which reads cookies — this cannot run on the edge. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'claude-opus-5';
const MAX_TURNS = 24;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4_000),
      }),
    )
    .min(1)
    .max(MAX_TURNS),
});

/**
 * A crude per-IP throttle. This endpoint spends money on every call, so it must
 * not be free to hammer; an in-memory window is enough for one server and is
 * honest about what it is — swap in a shared store before running more than one.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function textStream(text: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Accel-Buffering': 'no',
};

async function handlePOST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many messages. Give it a minute.' }, { status: 429 });
  }

  const { messages } = parsed.data;

  // Demo mode: the app runs with zero configuration, so the panel still answers
  // — from retrieval only, and the UI labels it as such.
  if (!process.env.ANTHROPIC_API_KEY) {
    const last = messages.filter((m) => m.role === 'user').at(-1);
    const answer = await demoAnswer(last?.content ?? '');
    return new Response(textStream(answer), { headers: { ...STREAM_HEADERS, 'X-Chat-Mode': 'demo' } });
  }

  const client = new Anthropic();

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 4_000,
    // The concierge answers from four small tools; deep reasoning would buy
    // latency in a chat panel and little else.
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools: CHAT_TOOLS,
    messages,
    stream: true,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const messageStream of runner) {
          for await (const event of messageStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        }
      } catch (error) {
        // The response has already begun, so a status code is no longer
        // available — the only honest thing left is to say so in the transcript.
        console.error('[chat] stream failed', error);
        controller.enqueue(encoder.encode('\n\nSomething went wrong reaching the assistant. Please try again.'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { ...STREAM_HEADERS, 'X-Chat-Mode': 'live' } });
}

/** Wrapped so every call lands in the Super Admin API log. */
export const POST = withLogging(handlePOST, 'Assistant');
