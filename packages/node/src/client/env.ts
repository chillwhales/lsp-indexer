import { IndexerError } from '../errors';

/**
 * Get the public HTTP GraphQL endpoint URL for client-side usage.
 *
 * Reads from `NEXT_PUBLIC_INDEXER_URL` environment variable.
 * Throws `IndexerError` with `MISSING_ENV_VAR` if not set, or
 * `INVALID_URL` if the value is not a valid URL.
 */
export function getClientUrl(): string {
  const url = process.env.NEXT_PUBLIC_INDEXER_URL;
  if (!url) {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'MISSING_ENV_VAR',
      message:
        'NEXT_PUBLIC_INDEXER_URL is not set. Set this environment variable to your Hasura GraphQL HTTP endpoint (e.g., https://indexer.example.com/v1/graphql).',
    });
  }
  try {
    new URL(url);
  } catch {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'INVALID_URL',
      message: `NEXT_PUBLIC_INDEXER_URL is not a valid URL: "${url}". Expected a full URL like https://indexer.example.com/v1/graphql.`,
    });
  }
  return url;
}

/**
 * Get the HTTP GraphQL endpoint URL for server-side usage.
 *
 * Reads from `INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`.
 * Throws `IndexerError` with `MISSING_ENV_VAR` if neither is set, or
 * `INVALID_URL` if the value is not a valid URL.
 */
export function getServerUrl(): string {
  const source = process.env.INDEXER_URL ? 'INDEXER_URL' : 'NEXT_PUBLIC_INDEXER_URL';
  const url = process.env.INDEXER_URL ?? process.env.NEXT_PUBLIC_INDEXER_URL;
  if (!url) {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'MISSING_ENV_VAR',
      message:
        'Neither INDEXER_URL nor NEXT_PUBLIC_INDEXER_URL is set. Set INDEXER_URL for server-side GraphQL requests (e.g., https://indexer.example.com/v1/graphql).',
    });
  }
  try {
    new URL(url);
  } catch {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'INVALID_URL',
      message: `${source} is not a valid URL: "${url}". Expected a full URL like https://indexer.example.com/v1/graphql.`,
    });
  }
  return url;
}

/**
 * Derive a WebSocket URL from an HTTP URL by swapping protocol.
 * Validates that the source URL uses http or https before swapping.
 *
 * @param httpUrl - The HTTP URL to derive from
 * @param envVarName - Name of the env var (for error messages)
 * @returns The derived WebSocket URL
 */
function deriveWsUrl(httpUrl: string, envVarName: string): string {
  const parsed = new URL(httpUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'INVALID_URL',
      message: `${envVarName} must use http or https to derive a WebSocket URL, but got "${httpUrl}". Expected a URL like https://indexer.example.com/v1/graphql.`,
    });
  }
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  return parsed.toString();
}

/**
 * Get the WebSocket endpoint URL for server-side subscriptions,
 * falling back to auto-derivation from the HTTP URL.
 *
 * Priority:
 * 1. `INDEXER_WS_URL` env var (explicit server-side WS URL)
 * 2. Derived from `getServerUrl()` (`INDEXER_URL`) by swapping protocol:
 *    - `https://` → `wss://`
 *    - `http://` → `ws://`
 *
 * Never reads `NEXT_PUBLIC_*` env vars — server-side only.
 *
 * @returns WebSocket URL string
 * @throws IndexerError if explicit WS URL is invalid, or if neither WS URL nor HTTP URL is configured
 */
export function getServerWsUrl(): string {
  const wsUrl = process.env.INDEXER_WS_URL;
  if (wsUrl) {
    try {
      new URL(wsUrl);
      return wsUrl;
    } catch {
      throw new IndexerError({
        category: 'CONFIGURATION',
        code: 'INVALID_URL',
        message: `INDEXER_WS_URL is not a valid URL: "${wsUrl}". Expected a full URL like wss://indexer.example.com/v1/graphql.`,
      });
    }
  }
  // No explicit WS URL — derive from HTTP URL (getServerUrl throws if not set)
  return deriveWsUrl(getServerUrl(), 'INDEXER_URL');
}

/**
 * Get the public WebSocket endpoint URL for client-side subscriptions,
 * falling back to auto-derivation from the HTTP URL.
 *
 * Priority:
 * 1. `NEXT_PUBLIC_INDEXER_WS_URL` env var (explicit WS URL)
 * 2. Derived from `NEXT_PUBLIC_INDEXER_URL` by swapping protocol:
 *    - `https://` → `wss://`
 *    - `http://` → `ws://`
 *
 * @returns WebSocket URL string
 * @throws IndexerError if neither WS URL nor HTTP URL is configured
 */
export function getClientWsUrl(): string {
  const wsUrl = process.env.NEXT_PUBLIC_INDEXER_WS_URL;
  if (wsUrl) {
    try {
      new URL(wsUrl);
      return wsUrl;
    } catch {
      throw new IndexerError({
        category: 'CONFIGURATION',
        code: 'INVALID_URL',
        message: `NEXT_PUBLIC_INDEXER_WS_URL is not a valid URL: "${wsUrl}". Expected a full URL like wss://indexer.example.com/v1/graphql.`,
      });
    }
  }
  // No explicit WS URL — derive from HTTP URL (getClientUrl throws if not set)
  return deriveWsUrl(getClientUrl(), 'NEXT_PUBLIC_INDEXER_URL');
}
