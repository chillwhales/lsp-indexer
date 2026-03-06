import { fetchOwnedToken, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedToken } from '../factories';

/** Single owned token by ID. Returns { ownedToken } instead of data. Disabled when id is falsy. */
export const useOwnedToken = createUseOwnedToken((params) =>
  fetchOwnedToken(getClientUrl(), params),
);
