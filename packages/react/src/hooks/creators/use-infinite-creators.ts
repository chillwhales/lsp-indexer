import { fetchCreators, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteCreators } from '../factories';

/** Infinite scroll creators. Separate cache key from useCreators. Returns { creators } instead of data. */
export const useInfiniteCreators = createUseInfiniteCreators((params) =>
  fetchCreators(getClientUrl(), params),
);
