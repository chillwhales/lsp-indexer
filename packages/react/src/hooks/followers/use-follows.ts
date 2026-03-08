import { fetchFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseFollows } from '../factories';

/** Paginated follow relationships. Returns { follows, totalCount } instead of data. */
export const useFollows = createUseFollows((params) => fetchFollows(getClientUrl(), params));
