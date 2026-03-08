import { fetchTokenIdDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseTokenIdDataChangedEvents } from '../factories';

/** Paginated ERC725Y TokenIdDataChanged events. Returns { tokenIdDataChangedEvents, totalCount } instead of data. */
export const useTokenIdDataChangedEvents = createUseTokenIdDataChangedEvents((params) =>
  fetchTokenIdDataChangedEvents(getClientUrl(), params),
);
