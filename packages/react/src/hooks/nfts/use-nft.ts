import { fetchNft, getClientUrl } from '@lsp-indexer/node';
import { createUseNft } from '../factories';

/** Single NFT by address + tokenId. Returns { nft } instead of data. Disabled when address is falsy. */
export const useNft = createUseNft((params) => fetchNft(getClientUrl(), params));
