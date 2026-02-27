import { getServerWsUrl } from '@lsp-indexer/node';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

/**
 * Options for the SSE subscription handler factory.
 *
 * @example
 * ```ts
 * // Use defaults (reads INDEXER_WS_URL, or derives from INDEXER_URL):
 * export const GET = createSubscriptionHandler();
 *
 * // Override WS URL:
 * export const GET = createSubscriptionHandler({ wsUrl: 'wss://custom.hasura.io/v1/graphql' });
 * ```
 */
interface SubscriptionHandlerOptions {
  /**
   * WebSocket URL for the Hasura GraphQL endpoint.
   * Defaults to `getServerWsUrl()` from `@lsp-indexer/node`
   * (reads `INDEXER_WS_URL`, or derives from `INDEXER_URL`).
   */
  wsUrl?: string;
}

/** SSE headers for streaming subscription data to the client. */
const SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
};

/**
 * Factory that creates a Next.js Route Handler (`GET`) for streaming
 * GraphQL subscriptions to the browser via Server-Sent Events (SSE).
 *
 * **How it works:**
 * 1. The client sends a `GET` request with `query` (a GraphQL document string)
 *    and `variables` (a JSON-encoded string) as URL search parameters.
 * 2. The handler opens a `graphql-ws` WebSocket connection to Hasura (server-side only).
 * 3. Subscription results are forwarded to the client as SSE `data:` frames.
 * 4. When the client disconnects (or the subscription completes/errors), both the
 *    WebSocket subscription and the SSE stream are cleaned up.
 *
 * Each SSE connection gets its own dedicated `graphql-ws` client — no pooling,
 * no sharing. The WebSocket lives exactly as long as the SSE stream.
 *
 * @param options - Optional handler configuration (e.g. custom `wsUrl`)
 * @returns A Next.js Route Handler function suitable for `export const GET = ...`
 *
 * @example
 * ```ts
 * // app/api/subscriptions/route.ts
 * import { createSubscriptionHandler } from '@lsp-indexer/next';
 *
 * export const GET = createSubscriptionHandler();
 * ```
 *
 * @example
 * ```ts
 * // With custom WebSocket URL
 * import { createSubscriptionHandler } from '@lsp-indexer/next';
 *
 * export const GET = createSubscriptionHandler({
 *   wsUrl: 'wss://my-hasura.example.com/v1/graphql',
 * });
 * ```
 */
export function createSubscriptionHandler(
  options?: SubscriptionHandlerOptions,
): (request: Request) => Response {
  return (request: Request): Response => {
    const url = new URL(request.url);
    const queryParam = url.searchParams.get('query');
    const variablesParam = url.searchParams.get('variables');

    if (!queryParam) {
      return new Response('Missing "query" search parameter', { status: 400 });
    }

    let variables: Record<string, unknown> | undefined;
    if (variablesParam) {
      try {
        const parsed: unknown = JSON.parse(variablesParam);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          return new Response('"variables" must be a JSON object', { status: 400 });
        }
        // parsed is narrowed to `object` (non-null, non-array) — spread into
        // a fresh Record to satisfy the constraint without type assertions.
        variables = Object.fromEntries(Object.entries(parsed));
      } catch {
        return new Response('Invalid JSON in "variables" search parameter', { status: 400 });
      }
    }

    const wsUrl = options?.wsUrl ?? getServerWsUrl();

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Create a dedicated graphql-ws client for this SSE connection.
        // Not lazy — we want the connection to open immediately since we
        // have an active subscriber waiting for data.
        const client = createClient({
          url: wsUrl,
          webSocketImpl: WebSocket,
          lazy: false,
          retryAttempts: 0,
        });

        // Track cleanup state to avoid double-close on the controller
        let closed = false;

        function closeStream(): void {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            // Stream may already be closed (e.g. client disconnected)
          }
        }

        /** Write an SSE frame to the stream. */
        function writeSSE(data: string, event?: string): void {
          if (closed) return;
          try {
            let frame = '';
            if (event) {
              frame += `event: ${event}\n`;
            }
            frame += `data: ${data}\n\n`;
            controller.enqueue(encoder.encode(frame));
          } catch {
            // Enqueue can throw if the stream was cancelled
            closeStream();
          }
        }

        // Subscribe via graphql-ws — one subscription per SSE connection
        const unsubscribe = client.subscribe(
          { query: queryParam, variables },
          {
            next(result) {
              writeSSE(JSON.stringify(result));
            },
            error(rawError) {
              // Serialize the error for the client
              const errorPayload = serializeSubscriptionError(rawError);
              writeSSE(JSON.stringify(errorPayload), 'error');
              closeStream();
              client.dispose();
            },
            complete() {
              writeSSE('{}', 'complete');
              closeStream();
              client.dispose();
            },
          },
        );

        // Clean up when the client disconnects (request aborted)
        if (request.signal) {
          request.signal.addEventListener(
            'abort',
            () => {
              unsubscribe();
              closeStream();
              client.dispose();
            },
            { once: true },
          );
        }
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Serialize an unknown subscription error into a JSON-safe structure.
 *
 * graphql-ws types the error callback parameter as `unknown` to avoid DOM deps.
 * It can be:
 * - An `Error` instance
 * - A `CloseEvent`-like object (`{ code, reason }`)
 * - An array of GraphQL errors
 * - Something else entirely
 */
function serializeSubscriptionError(rawError: unknown): { message: string; code?: string } {
  if (rawError instanceof Error) {
    return { message: rawError.message };
  }

  if (Array.isArray(rawError)) {
    const messages = rawError
      .map((e: unknown) => {
        if (
          typeof e === 'object' &&
          e !== null &&
          'message' in e &&
          typeof e.message === 'string'
        ) {
          return e.message;
        }
        return String(e);
      })
      .join('; ');
    return { message: messages, code: 'GRAPHQL_ERROR' };
  }

  if (typeof rawError === 'object' && rawError !== null) {
    // CloseEvent-like: { code: number, reason: string }
    if ('code' in rawError && 'reason' in rawError) {
      const code = typeof rawError.code === 'number' ? String(rawError.code) : undefined;
      const reason =
        'reason' in rawError && typeof rawError.reason === 'string'
          ? rawError.reason
          : 'WebSocket closed';
      return { message: reason, code };
    }

    if ('message' in rawError && typeof rawError.message === 'string') {
      return { message: rawError.message };
    }
  }

  return { message: String(rawError) };
}
