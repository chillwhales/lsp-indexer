'use server';

import {
  type FetchOwnedTokensResult,
  fetchOwnedToken,
  fetchOwnedTokens,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type OwnedToken,
  type OwnedTokenFilter,
  type OwnedTokenInclude,
  type OwnedTokenResult,
  type OwnedTokenSort,
  type PartialOwnedToken,
  UseOwnedTokenParamsSchema,
  UseOwnedTokensParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a single owned token by ID. */
export async function getOwnedToken(params: { id: string }): Promise<OwnedToken | null>;
export async function getOwnedToken<const I extends OwnedTokenInclude>(params: {
  id: string;
  include: I;
}): Promise<OwnedTokenResult<I> | null>;
export async function getOwnedToken(params: {
  id: string;
  include?: OwnedTokenInclude;
}): Promise<PartialOwnedToken | null>;
export async function getOwnedToken(params: {
  id: string;
  include?: OwnedTokenInclude;
}): Promise<PartialOwnedToken | null> {
  validateInput(UseOwnedTokenParamsSchema, params, 'getOwnedToken');
  return await fetchOwnedToken(getServerUrl(), params);
}

/** Server action: fetch a paginated list of owned tokens. */
export async function getOwnedTokens(params?: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  offset?: number;
}): Promise<FetchOwnedTokensResult>;
export async function getOwnedTokens<const I extends OwnedTokenInclude>(params?: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchOwnedTokensResult<OwnedTokenResult<I>>>;
export async function getOwnedTokens(params?: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  offset?: number;
  include?: OwnedTokenInclude;
}): Promise<FetchOwnedTokensResult<PartialOwnedToken>>;
export async function getOwnedTokens(params?: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  offset?: number;
  include?: OwnedTokenInclude;
}): Promise<FetchOwnedTokensResult<PartialOwnedToken>> {
  if (params) validateInput(UseOwnedTokensParamsSchema, params, 'getOwnedTokens');
  return await fetchOwnedTokens(getServerUrl(), params);
}
