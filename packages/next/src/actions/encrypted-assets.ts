'use server';

import type { FetchEncryptedAssetsResult } from '@lsp-indexer/node';
import { fetchEncryptedAssets, getServerUrl } from '@lsp-indexer/node';
import type {
  EncryptedAssetFilter,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  EncryptedAssetSort,
  PartialEncryptedAsset,
} from '@lsp-indexer/types';
import { UseEncryptedAssetsParamsSchema } from '@lsp-indexer/types';
import { validateInput } from './validate';

/**
 * Server action: Fetch a paginated list of LSP29 encrypted asset records.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchEncryptedAssets` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * No singular `getEncryptedAsset` action exists because encrypted asset records
 * have no reliable natural key (user-introduced elements can share address +
 * contentId + revision). Developers query by filter instead.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed encrypted assets and total count
 */
export async function getEncryptedAssets(params?: {
  filter?: EncryptedAssetFilter;
  sort?: EncryptedAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchEncryptedAssetsResult>;
export async function getEncryptedAssets<const I extends EncryptedAssetInclude>(params?: {
  filter?: EncryptedAssetFilter;
  sort?: EncryptedAssetSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchEncryptedAssetsResult<EncryptedAssetResult<I>>>;
export async function getEncryptedAssets(params?: {
  filter?: EncryptedAssetFilter;
  sort?: EncryptedAssetSort;
  limit?: number;
  offset?: number;
  include?: EncryptedAssetInclude;
}): Promise<FetchEncryptedAssetsResult<PartialEncryptedAsset>>;
export async function getEncryptedAssets(params?: {
  filter?: EncryptedAssetFilter;
  sort?: EncryptedAssetSort;
  limit?: number;
  offset?: number;
  include?: EncryptedAssetInclude;
}): Promise<FetchEncryptedAssetsResult<PartialEncryptedAsset>> {
  if (params) validateInput(UseEncryptedAssetsParamsSchema, params, 'getEncryptedAssets');
  return fetchEncryptedAssets(getServerUrl(), params);
}
