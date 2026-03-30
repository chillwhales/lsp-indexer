import { fetchCollectionAttributes, getClientUrl } from '@lsp-indexer/node';
import { createUseCollectionAttributes } from '../factories';

/** Distinct {key, value} attribute pairs and total NFT count for a collection address. */
export const useCollectionAttributes = createUseCollectionAttributes((collectionAddress) =>
  fetchCollectionAttributes(getClientUrl(), { collectionAddress }),
);
