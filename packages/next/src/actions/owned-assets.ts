'use server';

import type { FetchOwnedAssetsResult } from '@lsp-indexer/node';
import { fetchOwnedAsset, fetchOwnedAssets, getServerUrl } from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetFilter,
  OwnedAssetInclude,
  OwnedAssetResult,
  OwnedAssetSort,
  PartialOwnedAsset,
} from '@lsp-indexer/types';
import { UseOwnedAssetParamsSchema, UseOwnedAssetsParamsSchema } from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a single owned asset by ID. */
export async function getOwnedAsset(params: { id: string }): Promise<OwnedAsset | null>;
export async function getOwnedAsset<const I extends OwnedAssetInclude>(params: {
  id: string;
  include: I;
}): Promise<OwnedAssetResult<I> | null>;
export async function getOwnedAsset(params: {
  id: string;
  include?: OwnedAssetInclude;
}): Promise<PartialOwnedAsset | null>;
export async function getOwnedAsset(params: {
  id: string;
  include?: OwnedAssetInclude;
}): Promise<PartialOwnedAsset | null> {
  validateInput(UseOwnedAssetParamsSchema, params, 'getOwnedAsset');
  return fetchOwnedAsset(getServerUrl(), params);
}

/** Server action: fetch a paginated list of owned assets. */
export async function getOwnedAssets(params?: {
  filter?: OwnedAssetFilter;
  sort?: OwnedAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchOwnedAssetsResult>;
export async function getOwnedAssets<const I extends OwnedAssetInclude>(params?: {
  filter?: OwnedAssetFilter;
  sort?: OwnedAssetSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchOwnedAssetsResult<OwnedAssetResult<I>>>;
export async function getOwnedAssets(params?: {
  filter?: OwnedAssetFilter;
  sort?: OwnedAssetSort;
  limit?: number;
  offset?: number;
  include?: OwnedAssetInclude;
}): Promise<FetchOwnedAssetsResult<PartialOwnedAsset>>;
export async function getOwnedAssets(params?: {
  filter?: OwnedAssetFilter;
  sort?: OwnedAssetSort;
  limit?: number;
  offset?: number;
  include?: OwnedAssetInclude;
}): Promise<FetchOwnedAssetsResult<PartialOwnedAsset>> {
  if (params) validateInput(UseOwnedAssetsParamsSchema, params, 'getOwnedAssets');
  return fetchOwnedAssets(getServerUrl(), params);
}
