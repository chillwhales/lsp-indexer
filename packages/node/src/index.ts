// Error handling
export { IndexerError } from './errors';

// Client utilities (execute, env helpers)
export { execute, getClientUrl, getClientWsUrl, getServerUrl, getServerWsUrl } from './client';

// Profile services (the core fetching layer)
export { buildProfileIncludeVars, fetchProfile, fetchProfiles } from './services/profiles';
export type { FetchProfilesResult } from './services/profiles';

// Profile parsers (Hasura → clean types)
export { parseProfile, parseProfiles } from './parsers/profiles';

// Query key factories (shared by @lsp-indexer/react and @lsp-indexer/next)
export { profileKeys } from './keys/profiles';

// GraphQL documents (for advanced usage / custom queries)
export { GetProfileDocument, GetProfilesDocument } from './documents/profiles';

// Digital asset services (the core fetching layer)
export {
  buildDigitalAssetIncludeVars,
  fetchDigitalAsset,
  fetchDigitalAssets,
} from './services/digital-assets';
export type { FetchDigitalAssetsResult } from './services/digital-assets';

// Digital asset parsers (Hasura → clean types)
export { parseDigitalAsset, parseDigitalAssets } from './parsers/digital-assets';

// Digital asset query key factory
export { digitalAssetKeys } from './keys/digital-assets';

// Digital asset GraphQL documents (for advanced usage / custom queries)
export { GetDigitalAssetDocument, GetDigitalAssetsDocument } from './documents/digital-assets';

// NFT services (the core fetching layer)
export { buildNftIncludeVars, fetchNft, fetchNfts } from './services/nfts';
export type { FetchNftsResult } from './services/nfts';

// NFT parsers (Hasura → clean types)
export { parseNft, parseNfts } from './parsers/nfts';

// NFT query key factory
export { nftKeys } from './keys/nfts';

// NFT GraphQL documents (for advanced usage / custom queries)
export { GetNftDocument, GetNftsDocument } from './documents/nfts';

// Owned asset services (the core fetching layer)
export { fetchOwnedAsset, fetchOwnedAssets } from './services/owned-assets';
export type { FetchOwnedAssetsResult } from './services/owned-assets';

// Owned asset parsers (Hasura → clean types)
export { parseOwnedAsset, parseOwnedAssets } from './parsers/owned-assets';

// Owned asset query key factory
export { ownedAssetKeys } from './keys/owned-assets';

// Owned asset GraphQL documents (for advanced usage / custom queries)
export { GetOwnedAssetDocument, GetOwnedAssetsDocument } from './documents/owned-assets';

// Owned token services (the core fetching layer)
export { fetchOwnedToken, fetchOwnedTokens } from './services/owned-tokens';
export type { FetchOwnedTokensResult } from './services/owned-tokens';

// Owned token parsers (Hasura → clean types)
export { parseOwnedToken, parseOwnedTokens } from './parsers/owned-tokens';

// Owned token query key factory
export { ownedTokenKeys } from './keys/owned-tokens';

// Owned token GraphQL documents (for advanced usage / custom queries)
export { GetOwnedTokenDocument, GetOwnedTokensDocument } from './documents/owned-tokens';

// Re-export codegen TypedDocumentString for advanced users
export type { TypedDocumentString } from './graphql/graphql';
