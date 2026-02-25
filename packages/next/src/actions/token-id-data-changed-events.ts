'use server';

import type { FetchTokenIdDataChangedEventsResult } from '@lsp-indexer/node';
import { fetchTokenIdDataChangedEvents, getServerUrl } from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  TokenIdDataChangedEventSort,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of ERC725Y TokenIdDataChanged event records.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchTokenIdDataChangedEvents` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed token ID data changed events and total count
 */
export async function getTokenIdDataChangedEvents(params: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
}): Promise<FetchTokenIdDataChangedEventsResult>;
export async function getTokenIdDataChangedEvents<
  const I extends TokenIdDataChangedEventInclude,
>(params: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchTokenIdDataChangedEventsResult<TokenIdDataChangedEventResult<I>>>;
export async function getTokenIdDataChangedEvents(params: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: TokenIdDataChangedEventInclude;
}): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>>;
export async function getTokenIdDataChangedEvents(params: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: TokenIdDataChangedEventInclude;
}): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>> {
  const url = getServerUrl();
  return fetchTokenIdDataChangedEvents(url, params);
}
