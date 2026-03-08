import { fetchNfts, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteNfts } from '../factories';

/** Infinite scroll NFTs. Separate cache key from useNfts. Returns { nfts } instead of data. */
export const useInfiniteNfts = createUseInfiniteNfts((params) => fetchNfts(getClientUrl(), params));
