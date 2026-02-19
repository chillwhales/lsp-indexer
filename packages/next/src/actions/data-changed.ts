'use server';

import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import { fetchDataChangedEvents, getServerUrl } from '@lsp-indexer/node';
import type { DataChangedFilter, DataChangedSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of ERC725 data change events.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchDataChangedEvents` server-side. Default sort is `blockNumber DESC`
 * (newest events first).
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed events and total count
 */
export async function getDataChangedEvents(params?: {
  filter?: DataChangedFilter;
  sort?: DataChangedSort;
  limit?: number;
  offset?: number;
}): Promise<FetchDataChangedEventsResult> {
  const url = getServerUrl();
  return fetchDataChangedEvents(url, params ?? {});
}
