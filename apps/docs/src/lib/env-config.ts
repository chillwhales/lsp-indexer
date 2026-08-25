import 'server-only';

/**
 * Server-only env availability detection.
 *
 * Exposes URL-availability flags plus non-secret network slugs—never endpoint values.
 * Called in the RSC root layout to produce props for the client-side
 * `EnvProvider` without leaking server secrets to the browser.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Boolean flags indicating which env vars are configured. */
export interface EnvAvailability {
  /** Client URL and network are both configured. */
  hasClientUrl: boolean;
  /** Server URL and network are both configured. */
  hasServerUrl: boolean;
  /** Explicit browser-visible network slug. */
  clientNetwork: string | null;
  /** Explicit server network slug, falling back only to the public selection. */
  serverNetwork: string | null;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detect which indexer env vars are available at runtime.
 *
 * URL values remain server-side. Network slugs are public request identity and are safe to pass
 * from RSC to client components.
 */
export function getEnvAvailability(): EnvAvailability {
  const clientNetwork = process.env.NEXT_PUBLIC_INDEXER_NETWORK ?? null;
  const serverNetwork = process.env.INDEXER_NETWORK ?? clientNetwork;
  const serverUrl = process.env.INDEXER_URL ?? process.env.NEXT_PUBLIC_INDEXER_URL;
  return {
    hasClientUrl: Boolean(process.env.NEXT_PUBLIC_INDEXER_URL && clientNetwork),
    hasServerUrl: Boolean(serverUrl && serverNetwork),
    clientNetwork,
    serverNetwork,
  };
}
