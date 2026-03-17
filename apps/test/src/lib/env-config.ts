import 'server-only';

/**
 * Server-only env availability detection.
 *
 * Exposes **boolean flags and the WS proxy URL** — never actual Hasura env var values.
 * Called in the RSC root layout to produce props for the client-side
 * `EnvProvider` and `Providers` without leaking server secrets to the browser.
 *
 * The WS proxy URL is safe to expose because it points to our own proxy (port 4000),
 * not the upstream Hasura endpoint.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Boolean flags indicating which env vars are configured. */
export interface EnvAvailability {
  /** `NEXT_PUBLIC_INDEXER_URL` is set (client-side HTTP). */
  hasClientUrl: boolean;
  /** `INDEXER_URL` is set explicitly (server-side HTTP). */
  hasServerUrl: boolean;
  /** Client-side WebSocket is derivable (`NEXT_PUBLIC_INDEXER_WS_URL` or `NEXT_PUBLIC_INDEXER_URL`). */
  hasClientWs: boolean;
  /** Server-side WebSocket is derivable (`INDEXER_WS_URL` or `INDEXER_URL`). */
  hasServerWs: boolean;
  /** Whether WebSocket subscriptions are available (either client or server). */
  hasWs: boolean;
  /**
   * WebSocket URL for subscriptions.
   * Prefers WS proxy URL (keeps Hasura URL hidden), falls back to client-side WS URL.
   * Safe to expose — this is our proxy URL, not the upstream Hasura endpoint.
   */
  wsUrl?: string;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detect which indexer env vars are available at runtime.
 *
 * CRITICAL: Never exposes actual Hasura URLs.
 * The wsUrl returned is either the WS proxy URL (safe, our own server)
 * or undefined (no WS available).
 * Safe to pass as serialisable props from RSC → client components.
 */
export function getEnvAvailability(): EnvAvailability {
  const hasClientWs =
    Boolean(process.env.NEXT_PUBLIC_INDEXER_WS_URL) ||
    Boolean(process.env.NEXT_PUBLIC_INDEXER_URL);
  const hasServerWs = Boolean(process.env.INDEXER_WS_URL) || Boolean(process.env.INDEXER_URL);
  const wsProxyPort = Number(process.env.WS_PROXY_PORT) || 4000;

  // Prefer WS proxy (keeps Hasura URL hidden from browser).
  // The proxy URL is safe to expose — it's our own server, not Hasura.
  let wsUrl: string | undefined;
  if (hasServerWs) {
    wsUrl = `ws://localhost:${wsProxyPort}`;
  }
  // No fallback to client WS URL — the React provider derives it from
  // NEXT_PUBLIC_INDEXER_WS_URL automatically when wsUrl is undefined.

  return {
    hasClientUrl: Boolean(process.env.NEXT_PUBLIC_INDEXER_URL),
    hasServerUrl: Boolean(process.env.INDEXER_URL),
    hasClientWs,
    hasServerWs,
    hasWs: hasClientWs || hasServerWs,
    wsUrl,
  };
}
