import { fetchDigitalAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseDigitalAssets } from '../factories';

/** Paginated digital asset list. Returns { digitalAssets, totalCount } instead of data. */
export const useDigitalAssets = createUseDigitalAssets((params) =>
  fetchDigitalAssets(getClientUrl(), params),
);
