import { fetchCreators, getClientUrl } from '@lsp-indexer/node';
import { createUseCreators } from '../factories';

/** Paginated LSP4 creator list. Returns { creators, totalCount } instead of data. */
export const useCreators = createUseCreators((params) => fetchCreators(getClientUrl(), params));
