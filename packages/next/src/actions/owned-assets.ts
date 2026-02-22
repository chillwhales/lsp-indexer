'use server';

import type { FetchOwnedAssetsResult } from '@lsp-indexer/node';
import { fetchOwnedAsset, fetchOwnedAssets, getServerUrl } from '@lsp-indexer/node';
import type {
  OwnedAssetFilter,
  OwnedAssetInclude,
  OwnedAssetResult,
  OwnedAssetSort,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a single owned asset by unique ID.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchOwnedAsset` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * @param id - The owned asset unique ID
 * @param include - Optional field inclusion config
 * @returns The parsed owned asset (narrowed by include), or `null` if not found
 */
export async function getOwnedAsset<const I extends OwnedAssetInclude | undefined = undefined>(
  id: string,
  include?: I,
): Promise<OwnedAssetResult<I> | null> {
  const url = getServerUrl();
  return fetchOwnedAsset(url, { id, include });
}

/**
 * Server action: Fetch a paginated list of owned assets.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchOwnedAssets` server-side. Supports filtering, sorting, pagination, and
 * field inclusion.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed owned assets and total count
 */
export async function getOwnedAssets<
  const I extends OwnedAssetInclude | undefined = undefined,
>(params?: {
  filter?: OwnedAssetFilter;
  sort?: OwnedAssetSort;
  limit?: number;
  offset?: number;
  include?: I;
}): Promise<FetchOwnedAssetsResult<I>> {
  const url = getServerUrl();
  return fetchOwnedAssets(url, params ?? {});
}
