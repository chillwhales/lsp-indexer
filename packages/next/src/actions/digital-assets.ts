'use server';

import type { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import { fetchDigitalAsset, fetchDigitalAssets, getServerUrl } from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetFilter,
  DigitalAssetInclude,
  DigitalAssetSort,
  PartialDigitalAsset,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a single digital asset by address.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchDigitalAsset` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * @param address - The digital asset contract address
 * @param include - Optional field inclusion config
 * @returns The parsed digital asset, or `null` if not found
 */
export async function getDigitalAsset(address: string): Promise<DigitalAsset | null>;
export async function getDigitalAsset(
  address: string,
  include: DigitalAssetInclude,
): Promise<PartialDigitalAsset | null>;
export async function getDigitalAsset(
  address: string,
  include?: DigitalAssetInclude,
): Promise<DigitalAsset | PartialDigitalAsset | null> {
  const url = getServerUrl();
  if (include) return fetchDigitalAsset(url, { address, include });
  return fetchDigitalAsset(url, { address });
}

/**
 * Server action: Fetch a paginated list of digital assets.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchDigitalAssets` server-side. Supports filtering, sorting, pagination, and
 * field inclusion.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed digital assets and total count
 */
export async function getDigitalAssets(params?: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchDigitalAssetsResult>;
export async function getDigitalAssets(params: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
  include: DigitalAssetInclude;
}): Promise<FetchDigitalAssetsResult<PartialDigitalAsset>>;
export async function getDigitalAssets(params?: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
  include?: DigitalAssetInclude;
}): Promise<FetchDigitalAssetsResult | FetchDigitalAssetsResult<PartialDigitalAsset>> {
  const url = getServerUrl();
  if (params?.include) return fetchDigitalAssets(url, params);
  return fetchDigitalAssets(url, params ?? {});
}
