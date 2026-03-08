import { fetchProfile, getClientUrl } from '@lsp-indexer/node';
import { createUseProfile } from '../factories';

/** Single profile by address. Returns { profile } instead of data. Disabled when address is falsy. */
export const useProfile = createUseProfile((params) => fetchProfile(getClientUrl(), params));
