import { fetchEncryptedAssetsBatch, getClientUrl } from '@lsp-indexer/node';
import { createUseEncryptedAssetsBatch } from '../factories';

/** Batch-fetch encrypted assets by (address, contentId, revision) tuples. Returns { encryptedAssets } without totalCount. */
export const useEncryptedAssetsBatch = createUseEncryptedAssetsBatch((params) =>
  fetchEncryptedAssetsBatch(getClientUrl(), params),
);
