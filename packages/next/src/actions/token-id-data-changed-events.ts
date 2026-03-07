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

/** Server action: fetch the most recent TokenIdDataChanged event. */
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

/** Server action: fetch a paginated list of TokenIdDataChanged events. */
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
