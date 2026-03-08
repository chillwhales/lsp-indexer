import { fetchOwnedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedAssets } from '../factories';

/** Paginated owned asset list. Returns { ownedAssets, totalCount } instead of data. */
export const useOwnedAssets = createUseOwnedAssets((params) =>
  fetchOwnedAssets(getClientUrl(), params),
);
