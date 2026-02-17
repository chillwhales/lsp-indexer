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
 * Throws `IndexerError` with `MISSING_ENV_VAR` if neither is set.
 */
export function getServerUrl(): string {
  const url = process.env.INDEXER_URL ?? process.env.NEXT_PUBLIC_INDEXER_URL;
  if (!url) {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'MISSING_ENV_VAR',
      message:
        'Neither INDEXER_URL nor NEXT_PUBLIC_INDEXER_URL is set. Set INDEXER_URL for server-side GraphQL requests (e.g., https://indexer.example.com/v1/graphql).',
    });
  }
  return url;
}

/**
 * Get the public WebSocket endpoint URL for client-side subscriptions.
 *
 * Reads from `NEXT_PUBLIC_INDEXER_WS_URL` environment variable.
 * Throws `IndexerError` with `MISSING_ENV_VAR` if not set.
 */
export function getClientWsUrl(): string {
  const url = process.env.NEXT_PUBLIC_INDEXER_WS_URL;
  if (!url) {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'MISSING_ENV_VAR',
      message:
        'NEXT_PUBLIC_INDEXER_WS_URL is not set. Set this environment variable to your Hasura GraphQL WebSocket endpoint (e.g., wss://indexer.example.com/v1/graphql).',
    });
  }
  return url;
}

/**
 * Get the WebSocket endpoint URL for server-side subscriptions.
 *
 * Reads from `INDEXER_WS_URL`, falling back to `NEXT_PUBLIC_INDEXER_WS_URL`.
 * Throws `IndexerError` with `MISSING_ENV_VAR` if neither is set.
 */
export function getServerWsUrl(): string {
  const url = process.env.INDEXER_WS_URL ?? process.env.NEXT_PUBLIC_INDEXER_WS_URL;
  if (!url) {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'MISSING_ENV_VAR',
      message:
        'Neither INDEXER_WS_URL nor NEXT_PUBLIC_INDEXER_WS_URL is set. Set INDEXER_WS_URL for server-side WebSocket subscriptions (e.g., wss://indexer.example.com/v1/graphql).',
    });
  }
  return url;
}
