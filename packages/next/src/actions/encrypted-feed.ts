'use server';

import type { FetchEncryptedAssetFeedResult } from '@lsp-indexer/node';
import { fetchEncryptedAssetFeed, getServerUrl } from '@lsp-indexer/node';
import type { EncryptedFeedFilter, EncryptedFeedSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of LSP29 Encrypted Asset Feed Entries.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchEncryptedAssetFeed` server-side using `NEXT_PUBLIC_HASURA_GRAPHQL_URL` or
 * `HASURA_GRAPHQL_URL` from the server environment. This keeps the GraphQL
 * endpoint invisible to the client.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed feed entries and total count
 */
export async function getEncryptedAssetFeed(params?: {
  filter?: EncryptedFeedFilter;
  sort?: EncryptedFeedSort;
  limit?: number;
  offset?: number;
}): Promise<FetchEncryptedAssetFeedResult> {
  const url = getServerUrl();
  return fetchEncryptedAssetFeed(url, params ?? {});
}
