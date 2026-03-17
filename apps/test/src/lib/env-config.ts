import 'server-only';

/**
 * Server-only env availability detection.
 *
 * Exposes **boolean flags and the WS proxy port** — never actual Hasura env var values.
 * Called in the RSC root layout to produce props for the client-side
 * `EnvProvider` and `Providers` without leaking server secrets to the browser.
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
  /** WS proxy port (default 4000). Passed to client so it can build the URL with the browser hostname. */
  wsProxyPort: number;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detect which indexer env vars are available at runtime.
 *
 * CRITICAL: Returns booleans and the proxy port only — never exposes actual URLs.
 * Safe to pass as serialisable props from RSC → client components.
 */
export function getEnvAvailability(): EnvAvailability {
  return {
    hasClientUrl: Boolean(process.env.NEXT_PUBLIC_INDEXER_URL),
    hasServerUrl: Boolean(process.env.INDEXER_URL),
    hasClientWs:
      Boolean(process.env.NEXT_PUBLIC_INDEXER_WS_URL) ||
      Boolean(process.env.NEXT_PUBLIC_INDEXER_URL),
    hasServerWs: Boolean(process.env.INDEXER_WS_URL) || Boolean(process.env.INDEXER_URL),
    wsProxyPort: Number(process.env.WS_PROXY_PORT) || 4000,
  };
}
