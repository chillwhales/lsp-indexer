'use server';

import {
  type FetchEncryptedAssetsResult,
  fetchEncryptedAssets,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type EncryptedAssetFilter,
  type EncryptedAssetInclude,
  type EncryptedAssetResult,
  type EncryptedAssetSort,
  type PartialEncryptedAsset,
  UseEncryptedAssetsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a paginated list of encrypted assets. */
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
  return await fetchEncryptedAssets(getServerUrl(), params);
}
