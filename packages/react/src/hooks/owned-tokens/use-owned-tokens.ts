import { fetchOwnedTokens, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedTokens } from '../factories';

/** Paginated owned token list. Returns { ownedTokens, totalCount } instead of data. */
export const useOwnedTokens = createUseOwnedTokens((params) =>
  fetchOwnedTokens(getClientUrl(), params),
);
