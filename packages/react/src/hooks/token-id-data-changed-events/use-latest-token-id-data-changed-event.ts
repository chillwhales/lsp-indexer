import { fetchLatestTokenIdDataChangedEvent, getClientUrl } from '@lsp-indexer/node';
import { createUseLatestTokenIdDataChangedEvent } from '../factories';

/** Most recent TokenIdDataChanged event matching a filter. Returns { tokenIdDataChangedEvent } instead of data. */
export const useLatestTokenIdDataChangedEvent = createUseLatestTokenIdDataChangedEvent((params) =>
  fetchLatestTokenIdDataChangedEvent(getClientUrl(), params),
);
