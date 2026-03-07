'use server';

import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { fetchCreators, getServerUrl } from '@lsp-indexer/node';
import type {
  CreatorFilter,
  CreatorInclude,
  CreatorResult,
  CreatorSort,
  PartialCreator,
} from '@lsp-indexer/types';
import { UseCreatorsParamsSchema } from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a paginated list of creators. */
export async function getCreators(params?: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
}): Promise<FetchCreatorsResult>;
export async function getCreators<const I extends CreatorInclude>(params?: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchCreatorsResult<CreatorResult<I>>>;
export async function getCreators(params?: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
  include?: CreatorInclude;
}): Promise<FetchCreatorsResult<PartialCreator>>;
export async function getCreators(params?: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
  include?: CreatorInclude;
}): Promise<FetchCreatorsResult<PartialCreator>> {
  if (params) validateInput(UseCreatorsParamsSchema, params, 'getCreators');
  return fetchCreators(getServerUrl(), params);
}
