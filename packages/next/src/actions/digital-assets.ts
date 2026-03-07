'use server';

import {
  type FetchDigitalAssetsResult,
  fetchDigitalAsset,
  fetchDigitalAssets,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type DigitalAsset,
  type DigitalAssetFilter,
  type DigitalAssetInclude,
  type DigitalAssetResult,
  type DigitalAssetSort,
  type PartialDigitalAsset,
  UseDigitalAssetParamsSchema,
  UseDigitalAssetsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a single digital asset by address. */
export async function getDigitalAsset(params: { address: string }): Promise<DigitalAsset | null>;
export async function getDigitalAsset<const I extends DigitalAssetInclude>(params: {
  address: string;
  include: I;
}): Promise<DigitalAssetResult<I> | null>;
export async function getDigitalAsset(params: {
  address: string;
  include?: DigitalAssetInclude;
}): Promise<PartialDigitalAsset | null>;
export async function getDigitalAsset(params: {
  address: string;
  include?: DigitalAssetInclude;
}): Promise<PartialDigitalAsset | null> {
  validateInput(UseDigitalAssetParamsSchema, params, 'getDigitalAsset');
  return fetchDigitalAsset(getServerUrl(), params);
}

/** Server action: fetch a paginated list of digital assets. */
export async function getDigitalAssets(params?: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
}): Promise<FetchDigitalAssetsResult>;
export async function getDigitalAssets<const I extends DigitalAssetInclude>(params?: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchDigitalAssetsResult<DigitalAssetResult<I>>>;
export async function getDigitalAssets(params?: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
  include?: DigitalAssetInclude;
}): Promise<FetchDigitalAssetsResult<PartialDigitalAsset>>;
export async function getDigitalAssets(params?: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  offset?: number;
  include?: DigitalAssetInclude;
}): Promise<FetchDigitalAssetsResult<PartialDigitalAsset>> {
  if (params) validateInput(UseDigitalAssetsParamsSchema, params, 'getDigitalAssets');
  return fetchDigitalAssets(getServerUrl(), params);
}
