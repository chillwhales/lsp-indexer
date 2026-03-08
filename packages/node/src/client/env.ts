import { IndexerError } from '../errors';

/** Read `NEXT_PUBLIC_INDEXER_URL` for client-side HTTP endpoint. */
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

/** Read `INDEXER_URL` (falling back to `NEXT_PUBLIC_INDEXER_URL`) for server-side HTTP endpoint. */
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

/** Swap http(s) → ws(s) to derive a WebSocket URL. */
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

/** Read `INDEXER_WS_URL`, or derive from `getServerUrl()` by swapping protocol. */
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

/** Read `NEXT_PUBLIC_INDEXER_WS_URL`, or derive from `getClientUrl()` by swapping protocol. */
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
