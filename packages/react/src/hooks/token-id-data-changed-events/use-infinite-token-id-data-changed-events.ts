import { fetchTokenIdDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteTokenIdDataChangedEvents } from '../factories';

/** Infinite scroll TokenIdDataChanged events. Separate cache key from useTokenIdDataChangedEvents. Returns { tokenIdDataChangedEvents } instead of data. */
export const useInfiniteTokenIdDataChangedEvents = createUseInfiniteTokenIdDataChangedEvents(
  (params) => fetchTokenIdDataChangedEvents(getClientUrl(), params),
);
