import { fetchDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseDataChangedEvents } from '../factories';

/** Paginated ERC725Y DataChanged events. Returns { dataChangedEvents, totalCount } instead of data. */
export const useDataChangedEvents = createUseDataChangedEvents((params) =>
  fetchDataChangedEvents(getClientUrl(), params),
);
