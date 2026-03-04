'use server';

import type { FetchOwnedTokensResult } from '@lsp-indexer/node';
import { fetchOwnedToken, fetchOwnedTokens, getServerUrl } from '@lsp-indexer/node';
import type {
  OwnedToken,
  OwnedTokenFilter,
  OwnedTokenInclude,
  OwnedTokenResult,
  OwnedTokenSort,
  PartialOwnedToken,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a single owned token by unique ID.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchOwnedToken` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * @param id - The owned token unique ID
 * @param include - Optional field inclusion config
 * @returns The parsed owned token (narrowed by include), or `null` if not found
 */
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
  return fetchOwnedToken(getServerUrl(), params);
}

/**
 * Server action: Fetch a paginated list of owned tokens.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchOwnedTokens` server-side. Supports filtering, sorting, pagination, and
 * field inclusion.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed owned tokens and total count
 */
export async function getOwnedTokens(params?: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  offset?: number;
}): Promise<FetchOwnedTokensResult>;
export async function getOwnedTokens<const I extends OwnedTokenInclude>(params: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchOwnedTokensResult<OwnedTokenResult<I>>>;
export async function getOwnedTokens(params: {
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
  return fetchOwnedTokens(getServerUrl(), params);
}
