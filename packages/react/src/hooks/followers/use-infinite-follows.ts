import { fetchFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteFollows } from '../factories';

/** Infinite scroll follows. Separate cache key from useFollows. Returns { follows } instead of data. */
export const useInfiniteFollows = createUseInfiniteFollows((params) =>
  fetchFollows(getClientUrl(), params),
);
