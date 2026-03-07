'use server';

import { type FetchIssuedAssetsResult, fetchIssuedAssets, getServerUrl } from '@lsp-indexer/node';
import {
  type IssuedAssetFilter,
  type IssuedAssetInclude,
  type IssuedAssetResult,
  type IssuedAssetSort,
  type PartialIssuedAsset,
  UseIssuedAssetsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a paginated list of issued assets. */
export async function getIssuedAssets(params?: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchIssuedAssetsResult>;
export async function getIssuedAssets<const I extends IssuedAssetInclude>(params?: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchIssuedAssetsResult<IssuedAssetResult<I>>>;
export async function getIssuedAssets(params?: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
  include?: IssuedAssetInclude;
}): Promise<FetchIssuedAssetsResult<PartialIssuedAsset>>;
export async function getIssuedAssets(params?: {
  filter?: IssuedAssetFilter;
  sort?: IssuedAssetSort;
  limit?: number;
  offset?: number;
  include?: IssuedAssetInclude;
}): Promise<FetchIssuedAssetsResult<PartialIssuedAsset>> {
  if (params) validateInput(UseIssuedAssetsParamsSchema, params, 'getIssuedAssets');
  return fetchIssuedAssets(getServerUrl(), params);
}
