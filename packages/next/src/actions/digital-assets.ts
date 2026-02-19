'use server';

import type { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import { fetchDigitalAsset, fetchDigitalAssets, getServerUrl } from '@lsp-indexer/node';
import type { DigitalAsset, DigitalAssetFilter, DigitalAssetSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a single Digital Asset by address.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchDigitalAsset` server-side using `NEXT_PUBLIC_HASURA_GRAPHQL_URL` or
 * `HASURA_GRAPHQL_URL` from the server environment. This keeps the GraphQL
 * endpoint invisible to the client.
 *
 * @param address - The digital asset contract address
 * @returns The parsed digital asset, or `null` if not found
 */
export async function getDigitalAsset(address: string): Promise<DigitalAsset | null> {
  const url = getServerUrl();
  return fetchDigitalAsset(url, { address });
}

/**
 * Server action: Fetch a paginated list of Digital Assets.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchDigitalAssets` server-side. Supports filtering, sorting, and pagination.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed digital assets and total count
 */
export async function getDigitalAssets(params?: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchDigitalAssetsResult> {
  const url = getServerUrl();
  return fetchDigitalAssets(url, params ?? {});
}
