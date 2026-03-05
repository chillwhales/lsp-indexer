'use server';

import type { FetchTokenIdDataChangedEventsResult } from '@lsp-indexer/node';
import {
  fetchLatestTokenIdDataChangedEvent,
  fetchTokenIdDataChangedEvents,
  getServerUrl,
} from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  TokenIdDataChangedEventSort,
} from '@lsp-indexer/types';
import {
  UseLatestTokenIdDataChangedEventParamsSchema,
  UseTokenIdDataChangedEventsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/**
 * Server action: Fetch the most recent ERC725Y TokenIdDataChanged event matching the given filter.
 *
 * Runs on the Next.js server — routes `fetchLatestTokenIdDataChangedEvent` through server-side
 * execution using `getServerUrl()`.
 *
 * @param params - Query parameters (filter + optional include)
 * @returns The latest matching event, or `null` if none found
 */
export async function getLatestTokenIdDataChangedEvent(params?: {
  filter?: TokenIdDataChangedEventFilter;
}): Promise<TokenIdDataChangedEvent | null>;
export async function getLatestTokenIdDataChangedEvent<
  const I extends TokenIdDataChangedEventInclude,
>(params?: {
  filter?: TokenIdDataChangedEventFilter;
  include: I;
}): Promise<TokenIdDataChangedEventResult<I> | null>;
export async function getLatestTokenIdDataChangedEvent(params?: {
  filter?: TokenIdDataChangedEventFilter;
  include?: TokenIdDataChangedEventInclude;
}): Promise<PartialTokenIdDataChangedEvent | null>;
export async function getLatestTokenIdDataChangedEvent(params?: {
  filter?: TokenIdDataChangedEventFilter;
  include?: TokenIdDataChangedEventInclude;
}): Promise<PartialTokenIdDataChangedEvent | null> {
  if (params)
    validateInput(
      UseLatestTokenIdDataChangedEventParamsSchema,
      params,
      'getLatestTokenIdDataChangedEvent',
    );
  return fetchLatestTokenIdDataChangedEvent(getServerUrl(), params);
}

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
export async function getTokenIdDataChangedEvents(params?: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
}): Promise<FetchTokenIdDataChangedEventsResult>;
export async function getTokenIdDataChangedEvents<
  const I extends TokenIdDataChangedEventInclude,
>(params?: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchTokenIdDataChangedEventsResult<TokenIdDataChangedEventResult<I>>>;
export async function getTokenIdDataChangedEvents(params?: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: TokenIdDataChangedEventInclude;
}): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>>;
export async function getTokenIdDataChangedEvents(params?: {
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: TokenIdDataChangedEventInclude;
}): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>> {
  if (params)
    validateInput(UseTokenIdDataChangedEventsParamsSchema, params, 'getTokenIdDataChangedEvents');
  return fetchTokenIdDataChangedEvents(getServerUrl(), params);
}
