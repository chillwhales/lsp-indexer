import { fetchOwnedAsset, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedAsset } from '../factories';

/** Single owned asset by ID. Returns { ownedAsset } instead of data. Disabled when id is falsy. */
export const useOwnedAsset = createUseOwnedAsset((params) =>
  fetchOwnedAsset(getClientUrl(), params),
);
