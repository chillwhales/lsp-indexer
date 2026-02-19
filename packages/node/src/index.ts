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

// Social/Follow services (the core fetching layer)
export { fetchFollowCount, fetchFollowers, fetchFollowing } from './services/social';
export type { FetchFollowersResult, FetchFollowingResult } from './services/social';

// Social/Follow parsers (Hasura → clean types)
export { parseFollowCount, parseFollower, parseFollowers } from './parsers/social';

// Social/Follow query key factories
export { followerKeys } from './keys/social';

// Social/Follow GraphQL documents (for advanced usage / custom queries)
export { GetFollowCountDocument, GetFollowersDocument } from './documents/social';

// Creator services (the core fetching layer)
export { fetchCreatorAddresses } from './services/creators';
export type { FetchCreatorAddressesResult } from './services/creators';

// Creator parsers (Hasura → clean types)
export { parseCreator, parseCreators } from './parsers/creators';

// Creator query key factories
export { creatorKeys } from './keys/creators';

// Creator GraphQL documents
export { GetCreatorAddressesDocument } from './documents/creators';

// Universal Receiver services (the core fetching layer)
export { fetchUniversalReceiverEvents } from './services/universal-receiver';
export type { FetchUniversalReceiverEventsResult } from './services/universal-receiver';

// Universal Receiver parsers (Hasura → clean types)
export {
  parseUniversalReceiverEvent,
  parseUniversalReceiverEvents,
} from './parsers/universal-receiver';

// Universal Receiver query key factories
export { universalReceiverKeys } from './keys/universal-receiver';

// Universal Receiver GraphQL documents
export { GetUniversalReceiverEventsDocument } from './documents/universal-receiver';

// Data Changed Events services
export { fetchDataChangedEvents } from './services/data-changed';
export type { FetchDataChangedEventsResult } from './services/data-changed';

// Data Changed Events parsers
export { parseDataChangedEvent, parseDataChangedEvents } from './parsers/data-changed';

// Data Changed Events query key factories
export { dataChangedKeys } from './keys/data-changed';

// Data Changed Events GraphQL documents
export { GetDataChangedEventsDocument } from './documents/data-changed';

// NFT services (the core fetching layer)
export { fetchNft, fetchNfts } from './services/nfts';
export type { FetchNftsResult } from './services/nfts';

// NFT parsers (Hasura → clean types)
export { parseNft, parseNfts } from './parsers/nfts';

// NFT query key factories
export { nftKeys } from './keys/nfts';

// NFT GraphQL documents
export { GetNftDocument, GetNftsDocument } from './documents/nfts';

// Encrypted Assets services (the core fetching layer)
export { fetchEncryptedAsset, fetchEncryptedAssets } from './services/encrypted-assets';
export type { FetchEncryptedAssetsResult } from './services/encrypted-assets';

// Encrypted Assets parsers (Hasura → clean types)
export { parseEncryptedAsset, parseEncryptedAssets } from './parsers/encrypted-assets';

// Encrypted Assets query key factories
export { encryptedAssetKeys } from './keys/encrypted-assets';

// Encrypted Assets GraphQL documents
export {
  GetEncryptedAssetDocument,
  GetEncryptedAssetsDocument,
} from './documents/encrypted-assets';

// Encrypted Feed services (LSP29 feed entries)
export { fetchEncryptedAssetFeed } from './services/encrypted-feed';
export type { FetchEncryptedAssetFeedResult } from './services/encrypted-feed';

// Encrypted Feed parsers (Hasura → clean types)
export { parseEncryptedFeedEntries, parseEncryptedFeedEntry } from './parsers/encrypted-feed';

// Encrypted Feed query key factories
export { encryptedFeedKeys } from './keys/encrypted-feed';

// Encrypted Feed GraphQL documents
export { GetEncryptedAssetFeedDocument } from './documents/encrypted-feed';

// Digital Asset services (the core fetching layer)
export { fetchDigitalAsset, fetchDigitalAssets } from './services/digital-assets';
export type { FetchDigitalAssetsResult } from './services/digital-assets';

// Digital Asset parsers (Hasura → clean types)
export { parseDigitalAsset, parseDigitalAssets } from './parsers/digital-assets';

// Digital Asset query key factories
export { digitalAssetKeys } from './keys/digital-assets';

// Digital Asset GraphQL documents
export { GetDigitalAssetDocument, GetDigitalAssetsDocument } from './documents/digital-assets';

// Owned Assets services (LSP7 fungible + LSP8 NFT ownership)
export { fetchOwnedAssets, fetchOwnedTokens } from './services/owned-assets';
export type { FetchOwnedAssetsResult, FetchOwnedTokensResult } from './services/owned-assets';

// Owned Assets parsers (Hasura → clean types)
export {
  parseOwnedAsset,
  parseOwnedAssets,
  parseOwnedToken,
  parseOwnedTokens,
} from './parsers/owned-assets';

// Owned Assets query key factories
export { ownedAssetKeys, ownedTokenKeys } from './keys/owned-assets';

// Owned Assets GraphQL documents
export { GetOwnedAssetsDocument, GetOwnedTokensDocument } from './documents/owned-assets';

// GraphQL documents (for advanced usage / custom queries)
export { GetProfileDocument, GetProfilesDocument } from './documents/profiles';

// Re-export codegen TypedDocumentString for advanced users
export type { TypedDocumentString } from './graphql/graphql';
