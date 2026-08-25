'use server';

import {
  type FetchTokenIdDataChangedEventsResult,
  fetchLatestTokenIdDataChangedEvent,
  fetchTokenIdDataChangedEvents,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type PartialTokenIdDataChangedEvent,
  type TokenIdDataChangedEvent,
  type TokenIdDataChangedEventFilter,
  type TokenIdDataChangedEventInclude,
  type TokenIdDataChangedEventResult,
  type TokenIdDataChangedEventSort,
  UseLatestTokenIdDataChangedEventParamsSchema,
  UseTokenIdDataChangedEventsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch the most recent TokenIdDataChanged event. */
export async function getLatestTokenIdDataChangedEvent(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
}): Promise<TokenIdDataChangedEvent | null>;
export async function getLatestTokenIdDataChangedEvent<
  const I extends TokenIdDataChangedEventInclude,
>(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
  include: I;
}): Promise<TokenIdDataChangedEventResult<I> | null>;
export async function getLatestTokenIdDataChangedEvent(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
  include?: TokenIdDataChangedEventInclude;
}): Promise<PartialTokenIdDataChangedEvent | null>;
export async function getLatestTokenIdDataChangedEvent(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
  include?: TokenIdDataChangedEventInclude;
}): Promise<PartialTokenIdDataChangedEvent | null> {
  validateInput(
    UseLatestTokenIdDataChangedEventParamsSchema,
    params,
    'getLatestTokenIdDataChangedEvent',
  );
  return await fetchLatestTokenIdDataChangedEvent(getServerUrl(), params);
}

/** Server action: fetch a paginated list of TokenIdDataChanged events. */
export async function getTokenIdDataChangedEvents(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
}): Promise<FetchTokenIdDataChangedEventsResult>;
export async function getTokenIdDataChangedEvents<
  const I extends TokenIdDataChangedEventInclude,
>(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchTokenIdDataChangedEventsResult<TokenIdDataChangedEventResult<I>>>;
export async function getTokenIdDataChangedEvents(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: TokenIdDataChangedEventInclude;
}): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>>;
export async function getTokenIdDataChangedEvents(params: {
  network: string;
  filter?: TokenIdDataChangedEventFilter;
  sort?: TokenIdDataChangedEventSort;
  limit?: number;
  offset?: number;
  include?: TokenIdDataChangedEventInclude;
}): Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>> {
  validateInput(UseTokenIdDataChangedEventsParamsSchema, params, 'getTokenIdDataChangedEvents');
  return await fetchTokenIdDataChangedEvents(getServerUrl(), params);
}
