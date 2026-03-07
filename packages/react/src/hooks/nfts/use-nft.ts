import { fetchNft, getClientUrl } from '@lsp-indexer/node';
import { createUseNft } from '../factories';

/** Single NFT by address + tokenId/formattedTokenId. Disabled when address or both IDs are missing. */
export const useNft = createUseNft((params) => fetchNft(getClientUrl(), params));
