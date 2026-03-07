'use server';

import type { FetchUniversalReceiverEventsResult } from '@lsp-indexer/node';
import { fetchUniversalReceiverEvents, getServerUrl } from '@lsp-indexer/node';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEventFilter,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UniversalReceiverEventSort,
} from '@lsp-indexer/types';
import { UseUniversalReceiverEventsParamsSchema } from '@lsp-indexer/types';
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
