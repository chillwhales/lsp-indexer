'use server';

import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import {
  fetchDataChangedEvents,
  fetchLatestDataChangedEvent,
  getServerUrl,
} from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventResult,
  DataChangedEventSort,
  PartialDataChangedEvent,
} from '@lsp-indexer/types';
import {
  UseDataChangedEventsParamsSchema,
  UseLatestDataChangedEventParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/**
 * Server action: Fetch the most recent ERC725Y DataChanged event matching the given filter.
 *
 * Runs on the Next.js server — routes `fetchLatestDataChangedEvent` through server-side
 * execution using `getServerUrl()`.
 *
 * @param params - Query parameters (filter + optional include)
 * @returns The latest matching event, or `null` if none found
 */
export async function getLatestDataChangedEvent(params?: {
  filter?: DataChangedEventFilter;
}): Promise<DataChangedEvent | null>;
export async function getLatestDataChangedEvent<const I extends DataChangedEventInclude>(params?: {
  filter?: DataChangedEventFilter;
  include: I;
}): Promise<DataChangedEventResult<I> | null>;
export async function getLatestDataChangedEvent(params?: {
  filter?: DataChangedEventFilter;
  include?: DataChangedEventInclude;
}): Promise<PartialDataChangedEvent | null>;
export async function getLatestDataChangedEvent(params?: {
  filter?: DataChangedEventFilter;
  include?: DataChangedEventInclude;
}): Promise<PartialDataChangedEvent | null> {
  if (params)
    validateInput(UseLatestDataChangedEventParamsSchema, params, 'getLatestDataChangedEvent');
  return fetchLatestDataChangedEvent(getServerUrl(), params);
}

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
export async function getDataChangedEvents(params?: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
}): Promise<FetchDataChangedEventsResult>;
export async function getDataChangedEvents<const I extends DataChangedEventInclude>(params?: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchDataChangedEventsResult<DataChangedEventResult<I>>>;
export async function getDataChangedEvents(params?: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: DataChangedEventInclude;
}): Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>>;
export async function getDataChangedEvents(params?: {
  filter?: DataChangedEventFilter;
  sort?: DataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: DataChangedEventInclude;
}): Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>> {
  if (params) validateInput(UseDataChangedEventsParamsSchema, params, 'getDataChangedEvents');
  return fetchDataChangedEvents(getServerUrl(), params);
}
