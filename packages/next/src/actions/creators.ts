'use server';

import type { FetchCreatorAddressesResult } from '@lsp-indexer/node';
import { fetchCreatorAddresses, getServerUrl } from '@lsp-indexer/node';
import type { CreatorFilter, CreatorSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of LSP4 creators.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchCreatorAddresses` server-side using `NEXT_PUBLIC_HASURA_GRAPHQL_URL` or
 * `HASURA_GRAPHQL_URL` from the server environment. This keeps the GraphQL
 * endpoint invisible to the client.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed creators and total count
 */
export async function getCreatorAddresses(params?: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  offset?: number;
}): Promise<FetchCreatorAddressesResult> {
  const url = getServerUrl();
  return fetchCreatorAddresses(url, params ?? {});
}
