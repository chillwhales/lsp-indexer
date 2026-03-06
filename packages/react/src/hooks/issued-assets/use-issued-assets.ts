import { fetchIssuedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseIssuedAssets } from '../factories';

/** Paginated LSP12 issued asset list. Returns { issuedAssets, totalCount } instead of data. */
export const useIssuedAssets = createUseIssuedAssets((params) =>
  fetchIssuedAssets(getClientUrl(), params),
);
