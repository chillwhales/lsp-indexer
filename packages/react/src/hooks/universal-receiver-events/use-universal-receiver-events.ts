import { fetchUniversalReceiverEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseUniversalReceiverEvents } from '../factories';

/** Paginated UniversalReceiver events. Returns { universalReceiverEvents, totalCount } instead of data. */
export const useUniversalReceiverEvents = createUseUniversalReceiverEvents((params) =>
  fetchUniversalReceiverEvents(getClientUrl(), params),
);
