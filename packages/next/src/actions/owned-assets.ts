'use server';

import type { FetchOwnedAssetsResult, FetchOwnedTokensResult } from '@lsp-indexer/node';
import { fetchOwnedAssets, fetchOwnedTokens, getServerUrl } from '@lsp-indexer/node';
import type {
  OwnedAssetFilter,
  OwnedAssetSort,
  OwnedTokenFilter,
  OwnedTokenSort,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of owned assets (LSP7 fungible tokens).
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchOwnedAssets` server-side using `NEXT_PUBLIC_HASURA_GRAPHQL_URL` or
 * `HASURA_GRAPHQL_URL` from the server environment. This keeps the GraphQL
 * endpoint invisible to the client.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed owned assets and total count
 */
export async function getOwnedAssets(params?: {
  filter?: OwnedAssetFilter;
  sort?: OwnedAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchOwnedAssetsResult> {
  const url = getServerUrl();
  return fetchOwnedAssets(url, params ?? {});
}

/**
 * Server action: Fetch a paginated list of owned tokens (LSP8 NFTs).
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchOwnedTokens` server-side using `NEXT_PUBLIC_HASURA_GRAPHQL_URL` or
 * `HASURA_GRAPHQL_URL` from the server environment. This keeps the GraphQL
 * endpoint invisible to the client.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed owned tokens and total count
 */
export async function getOwnedTokens(params?: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  offset?: number;
}): Promise<FetchOwnedTokensResult> {
  const url = getServerUrl();
  return fetchOwnedTokens(url, params ?? {});
}
