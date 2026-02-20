// Error handling
export { IndexerError } from './errors';

// Client utilities (execute, env helpers)
export { execute, getClientUrl, getClientWsUrl, getServerUrl, getServerWsUrl } from './client';

// Profile services (the core fetching layer)
export { fetchProfile, fetchProfiles } from './services/profiles';
export type { FetchProfilesResult } from './services/profiles';

// Profile parsers (Hasura → clean types)
export { parseProfile, parseProfiles } from './parsers/profiles';

// Query key factories (shared by @lsp-indexer/react and @lsp-indexer/next)
export { profileKeys } from './keys/profiles';

// GraphQL documents (for advanced usage / custom queries)
export { GetProfileDocument, GetProfilesDocument } from './documents/profiles';

// Digital asset services (the core fetching layer)
export { fetchDigitalAsset, fetchDigitalAssets } from './services/digital-assets';
export type { FetchDigitalAssetsResult } from './services/digital-assets';

// Digital asset parsers (Hasura → clean types)
export { parseDigitalAsset, parseDigitalAssets } from './parsers/digital-assets';

// Digital asset query key factory
export { digitalAssetKeys } from './keys/digital-assets';

// Digital asset GraphQL documents (for advanced usage / custom queries)
export { GetDigitalAssetDocument, GetDigitalAssetsDocument } from './documents/digital-assets';

// Re-export codegen TypedDocumentString for advanced users
export type { TypedDocumentString } from './graphql/graphql';
