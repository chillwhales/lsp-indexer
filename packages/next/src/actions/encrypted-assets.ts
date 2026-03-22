'use server';

import {
  type FetchEncryptedAssetsBatchResult,
  type FetchEncryptedAssetsResult,
  fetchEncryptedAssets,
  fetchEncryptedAssetsBatch,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type EncryptedAssetBatchTuple,
  type EncryptedAssetFilter,
  type EncryptedAssetInclude,
  type EncryptedAssetResult,
  type EncryptedAssetSort,
  type PartialEncryptedAsset,
  UseEncryptedAssetsBatchParamsSchema,
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

/** Server action: fetch encrypted assets by batch of (address, contentId, revision) tuples. */
export async function getEncryptedAssetsBatch(params: {
  tuples: EncryptedAssetBatchTuple[];
}): Promise<FetchEncryptedAssetsBatchResult>;
export async function getEncryptedAssetsBatch<const I extends EncryptedAssetInclude>(params: {
  tuples: EncryptedAssetBatchTuple[];
  include: I;
}): Promise<FetchEncryptedAssetsBatchResult<EncryptedAssetResult<I>>>;
export async function getEncryptedAssetsBatch(params: {
  tuples: EncryptedAssetBatchTuple[];
  include?: EncryptedAssetInclude;
}): Promise<FetchEncryptedAssetsBatchResult<PartialEncryptedAsset>>;
export async function getEncryptedAssetsBatch(params: {
  tuples: EncryptedAssetBatchTuple[];
  include?: EncryptedAssetInclude;
}): Promise<FetchEncryptedAssetsBatchResult<PartialEncryptedAsset>> {
  validateInput(UseEncryptedAssetsBatchParamsSchema, params, 'getEncryptedAssetsBatch');
  return await fetchEncryptedAssetsBatch(getServerUrl(), params);
}
