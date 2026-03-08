import { fetchDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteDataChangedEvents } from '../factories';

/** Infinite scroll DataChanged events. Separate cache key from useDataChangedEvents. Returns { dataChangedEvents } instead of data. */
export const useInfiniteDataChangedEvents = createUseInfiniteDataChangedEvents((params) =>
  fetchDataChangedEvents(getClientUrl(), params),
);
