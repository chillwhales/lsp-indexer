import { fetchEncryptedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteEncryptedAssets } from '../factories';

/** Infinite scroll encrypted assets. Separate cache key from useEncryptedAssets. Returns { encryptedAssets } instead of data. */
export const useInfiniteEncryptedAssets = createUseInfiniteEncryptedAssets((params) =>
  fetchEncryptedAssets(getClientUrl(), params),
);
