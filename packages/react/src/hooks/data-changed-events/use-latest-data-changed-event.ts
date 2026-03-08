import { fetchLatestDataChangedEvent, getClientUrl } from '@lsp-indexer/node';
import { createUseLatestDataChangedEvent } from '../factories';

/** Most recent DataChanged event matching a filter. Returns { dataChangedEvent } instead of data. */
export const useLatestDataChangedEvent = createUseLatestDataChangedEvent((params) =>
  fetchLatestDataChangedEvent(getClientUrl(), params),
);
