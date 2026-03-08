import { fetchOwnedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteOwnedAssets } from '../factories';

/** Infinite scroll owned assets. Separate cache key from useOwnedAssets. Returns { ownedAssets } instead of data. */
export const useInfiniteOwnedAssets = createUseInfiniteOwnedAssets((params) =>
  fetchOwnedAssets(getClientUrl(), params),
);
