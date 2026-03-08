import { fetchUniversalReceiverEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteUniversalReceiverEvents } from '../factories';

/** Infinite scroll UniversalReceiver events. Separate cache key from useUniversalReceiverEvents. Returns { universalReceiverEvents } instead of data. */
export const useInfiniteUniversalReceiverEvents = createUseInfiniteUniversalReceiverEvents(
  (params) => fetchUniversalReceiverEvents(getClientUrl(), params),
);
