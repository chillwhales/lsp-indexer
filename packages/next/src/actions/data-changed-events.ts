'use server';

import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import { fetchDataChangedEvents, getServerUrl } from '@lsp-indexer/node';
import type {
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventResult,
  DataChangedEventSort,
  PartialDataChangedEvent,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of ERC725Y DataChanged event records.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchDataChangedEvents` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed data changed events and total count
 */
export async function getDataChangedEvents(params: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
}): Promise<FetchDataChangedEventsResult>;
export async function getDataChangedEvents<const I extends DataChangedEventInclude>(params: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchDataChangedEventsResult<DataChangedEventResult<I>>>;
export async function getDataChangedEvents(params: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: DataChangedEventInclude;
}): Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>>;
export async function getDataChangedEvents(params: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: DataChangedEventInclude;
}): Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>> {
  const url = getServerUrl();
  return fetchDataChangedEvents(url, params);
}
