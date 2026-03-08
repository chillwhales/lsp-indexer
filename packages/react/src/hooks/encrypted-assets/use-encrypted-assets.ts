import { fetchEncryptedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseEncryptedAssets } from '../factories';

/** Paginated LSP29 encrypted asset list. Returns { encryptedAssets, totalCount } instead of data. */
export const useEncryptedAssets = createUseEncryptedAssets((params) =>
  fetchEncryptedAssets(getClientUrl(), params),
);
