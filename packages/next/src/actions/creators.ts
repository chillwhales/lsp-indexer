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

/**
 * Server action: Fetch a paginated list of LSP4 creator records.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchCreators` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * No singular `getCreator` action exists because creator records have no
 * natural key (opaque Hasura ID only). Developers query by filter instead.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed creators and total count
 */
export async function getCreators(params: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
}): Promise<FetchCreatorsResult>;
export async function getCreators<const I extends CreatorInclude>(params: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchCreatorsResult<CreatorResult<I>>>;
export async function getCreators(params: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
  include?: CreatorInclude;
}): Promise<FetchCreatorsResult<PartialCreator>>;
export async function getCreators(params: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
  include?: CreatorInclude;
}): Promise<FetchCreatorsResult<PartialCreator>> {
  const url = getServerUrl();
  if (params.include) return fetchCreators(url, params);
  return fetchCreators(url, params);
}
