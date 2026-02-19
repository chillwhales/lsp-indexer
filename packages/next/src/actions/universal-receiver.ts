'use server';

import type { FetchUniversalReceiverEventsResult } from '@lsp-indexer/node';
import { fetchUniversalReceiverEvents, getServerUrl } from '@lsp-indexer/node';
import type { UniversalReceiverFilter, UniversalReceiverSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of Universal Receiver events.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchUniversalReceiverEvents` server-side. Supports filtering, sorting,
 * and pagination.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed events and total count
 */
export async function getUniversalReceiverEvents(params?: {
  filter?: UniversalReceiverFilter;
  sort?: UniversalReceiverSort;
  limit?: number;
  offset?: number;
}): Promise<FetchUniversalReceiverEventsResult> {
  const url = getServerUrl();
  return fetchUniversalReceiverEvents(url, params ?? {});
}
