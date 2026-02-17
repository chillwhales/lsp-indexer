// Error handling (also available from main entry, re-exported for convenience)
export { IndexerError } from './errors';
export type { IndexerErrorCategory, IndexerErrorCode, IndexerErrorOptions } from './errors';

// Server-side client utilities
export { execute, getServerUrl, getServerWsUrl } from './client';

// Profile services (server-side data fetching)
export { fetchProfile, fetchProfiles } from './services/profiles';
export type { FetchProfilesResult } from './services/profiles';
