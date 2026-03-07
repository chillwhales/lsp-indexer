import { fetchNfts, getClientUrl } from '@lsp-indexer/node';
import { createUseNfts } from '../factories';

/** Paginated NFT list. Returns { nfts, totalCount } instead of data. */
export const useNfts = createUseNfts((params) => fetchNfts(getClientUrl(), params));
