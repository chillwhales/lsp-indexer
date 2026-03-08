import { fetchDigitalAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteDigitalAssets } from '../factories';

/** Infinite scroll digital assets. Separate cache key from useDigitalAssets. Returns { digitalAssets } instead of data. */
export const useInfiniteDigitalAssets = createUseInfiniteDigitalAssets((params) =>
  fetchDigitalAssets(getClientUrl(), params),
);
