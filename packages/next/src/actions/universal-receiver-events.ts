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

/**
 * Server action: Fetch a paginated list of universal receiver event records.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchUniversalReceiverEvents` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * No singular `getUniversalReceiverEvent` action exists because event records have no
 * natural key (opaque Hasura ID only). Developers query by filter instead.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed universal receiver events and total count
 */
export async function getUniversalReceiverEvents(params: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
}): Promise<FetchUniversalReceiverEventsResult>;
export async function getUniversalReceiverEvents<
  const I extends UniversalReceiverEventInclude,
>(params: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchUniversalReceiverEventsResult<UniversalReceiverEventResult<I>>>;
export async function getUniversalReceiverEvents(params: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
  include?: UniversalReceiverEventInclude;
}): Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>>;
export async function getUniversalReceiverEvents(params: {
  filter?: UniversalReceiverEventFilter;
  sort?: UniversalReceiverEventSort;
  limit?: number;
  offset?: number;
  include?: UniversalReceiverEventInclude;
}): Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>> {
  return fetchUniversalReceiverEvents(getServerUrl(), params);
}
