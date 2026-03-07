'use server';

import {
  type FetchUniversalReceiverEventsResult,
  fetchUniversalReceiverEvents,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type PartialUniversalReceiverEvent,
  type UniversalReceiverEventFilter,
  type UniversalReceiverEventInclude,
  type UniversalReceiverEventResult,
  type UniversalReceiverEventSort,
  UseUniversalReceiverEventsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a paginated list of universal receiver events. */
export async function getUniversalReceiverEvents(params?: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
}): Promise<FetchUniversalReceiverEventsResult>;
export async function getUniversalReceiverEvents<
  const I extends UniversalReceiverEventInclude,
>(params?: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchUniversalReceiverEventsResult<UniversalReceiverEventResult<I>>>;
export async function getUniversalReceiverEvents(params?: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
  include?: UniversalReceiverEventInclude;
}): Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>>;
export async function getUniversalReceiverEvents(params?: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
  include?: UniversalReceiverEventInclude;
}): Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>> {
  if (params)
    validateInput(UseUniversalReceiverEventsParamsSchema, params, 'getUniversalReceiverEvents');
  return fetchUniversalReceiverEvents(getServerUrl(), params);
}
