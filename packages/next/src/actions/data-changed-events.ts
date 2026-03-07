'use server';

import {
  type FetchDataChangedEventsResult,
  fetchDataChangedEvents,
  fetchLatestDataChangedEvent,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type DataChangedEvent,
  type DataChangedEventFilter,
  type DataChangedEventInclude,
  type DataChangedEventResult,
  type DataChangedEventSort,
  type PartialDataChangedEvent,
  UseDataChangedEventsParamsSchema,
  UseLatestDataChangedEventParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch the most recent DataChanged event for a data key. */
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

/** Server action: fetch a paginated list of DataChanged events. */
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
