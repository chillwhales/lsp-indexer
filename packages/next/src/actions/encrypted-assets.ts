'use server';

import type { FetchEncryptedAssetsResult } from '@lsp-indexer/node';
import { fetchEncryptedAsset, fetchEncryptedAssets, getServerUrl } from '@lsp-indexer/node';
import type { EncryptedAsset, EncryptedAssetFilter, EncryptedAssetSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a single LSP29 Encrypted Asset by address.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchEncryptedAsset` server-side using the Hasura endpoint from environment.
 * This keeps the GraphQL endpoint invisible to the client.
 *
 * @param address - The encrypted asset contract address
 * @returns The parsed encrypted asset, or `null` if not found
 */
export async function getEncryptedAsset(address: string): Promise<EncryptedAsset | null> {
  const url = getServerUrl();
  return fetchEncryptedAsset(url, { address });
}

/**
 * Server action: Fetch a paginated list of LSP29 Encrypted Assets.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchEncryptedAssets` server-side. Supports filtering, sorting, and pagination.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed encrypted assets and total count
 */
export async function getEncryptedAssets(params?: {
  filter?: EncryptedAssetFilter;
  sort?: EncryptedAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchEncryptedAssetsResult> {
  const url = getServerUrl();
  return fetchEncryptedAssets(url, params ?? {});
}
