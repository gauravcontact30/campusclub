import { NextResponse, type NextRequest } from 'next/server';
import { recordEvent } from './events';
import { readVisitorId } from './visitor';
import { SERVER_VISITOR, SLOW_REQUEST_MS } from './config';

/**
 * Generic over the context so the wrapper keeps whatever shape the route
 * declares — Next type-checks each handler against its own segment's params,
 * and a fixed context type here would fail that check on every route.
 */
type Handler<C> = (request: NextRequest, context: C) => Promise<Response> | Response;

/**
 * Wraps a route handler so every call lands in the API log with its status and
 * how long it took.
 *
 * A wrapper rather than proxy-level logging because the proxy calls
 * `NextResponse.next()` and never sees what the route eventually returned —
 * it can log that a request arrived, not whether it worked, which is the only
 * part worth having.
 *
 * Three outcomes, not two:
 *   success — 2xx/3xx within the latency budget
 *   fail    — 5xx, or the handler threw
 *   alert   — worked, but somebody should look: any 4xx, or slower than
 *             SLOW_REQUEST_MS. A wall of 401s on the payment webhook is not a
 *             failure of the server and is exactly what an admin needs to see.
 *
 * A throw is logged and rethrown, never swallowed: the caller still gets
 * Next's error handling, and the log gains the one entry that explains it.
 */
export function withLogging<C>(handler: Handler<C>, label?: string): Handler<C> {
  return async (request: NextRequest, context: C) => {
    const started = Date.now();
    const path = new URL(request.url).pathname;

    const finish = async (status: number, message: string | null) => {
      const durationMs = Date.now() - started;
      const outcome =
        status >= 500 ? 'fail' : status >= 400 || durationMs > SLOW_REQUEST_MS ? 'alert' : 'success';
      await recordEvent({
        kind: 'api',
        path,
        label,
        method: request.method,
        status,
        durationMs,
        outcome,
        message:
          message ??
          (durationMs > SLOW_REQUEST_MS && status < 400 ? `Slow response (${durationMs}ms)` : null),
        visitorId: (await readVisitorId()) ?? SERVER_VISITOR,
      });
    };

    try {
      const response = await handler(request, context);
      await finish(response.status, null);
      return response;
    } catch (error) {
      // The message only — a stack trace in a log an admin reads in the
      // browser is noise at best and an information leak at worst.
      await finish(500, (error as Error).message ?? 'Unhandled error');
      throw error;
    }
  };
}

/** Convenience for handlers that want to record an alert of their own. */
export async function recordAlert(path: string, message: string) {
  await recordEvent({
    kind: 'api',
    path,
    outcome: 'alert',
    message,
    visitorId: (await readVisitorId()) ?? SERVER_VISITOR,
  });
}

export { NextResponse };
