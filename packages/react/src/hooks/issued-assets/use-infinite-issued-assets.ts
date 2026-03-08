import { fetchIssuedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteIssuedAssets } from '../factories';

/** Infinite scroll issued assets. Separate cache key from useIssuedAssets. Returns { issuedAssets } instead of data. */
export const useInfiniteIssuedAssets = createUseInfiniteIssuedAssets((params) =>
  fetchIssuedAssets(getClientUrl(), params),
);
