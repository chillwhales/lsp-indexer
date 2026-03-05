'use server';

import type { FetchIssuedAssetsResult } from '@lsp-indexer/node';
import { fetchIssuedAssets, getServerUrl } from '@lsp-indexer/node';
import type {
  IssuedAssetFilter,
  IssuedAssetInclude,
  IssuedAssetResult,
  IssuedAssetSort,
  PartialIssuedAsset,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of LSP12 issued asset records.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchIssuedAssets` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * No singular `getIssuedAsset` action exists because issued asset records have no
 * natural key (opaque Hasura ID only). Developers query by filter instead.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed issued assets and total count
 */
export async function getIssuedAssets(params: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchIssuedAssetsResult>;
export async function getIssuedAssets<const I extends IssuedAssetInclude>(params: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchIssuedAssetsResult<IssuedAssetResult<I>>>;
export async function getIssuedAssets(params: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
  include?: IssuedAssetInclude;
}): Promise<FetchIssuedAssetsResult<PartialIssuedAsset>>;
export async function getIssuedAssets(params: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
  include?: IssuedAssetInclude;
}): Promise<FetchIssuedAssetsResult<PartialIssuedAsset>> {
  return fetchIssuedAssets(getServerUrl(), params);
}
