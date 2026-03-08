import { fetchProfiles, getClientUrl } from '@lsp-indexer/node';
import { createUseProfiles } from '../factories';

/** Paginated profile list. Returns { profiles, totalCount } instead of data. */
export const useProfiles = createUseProfiles((params) => fetchProfiles(getClientUrl(), params));
