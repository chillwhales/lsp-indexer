import type { IncludeToggleConfig } from './include-toggles';

/**
 * Shared include-field configs for the 3 domain types that appear as nested
 * relations across multiple playground pages.
 *
 * Each array maps 1:1 to the corresponding Zod include schema
 * (ProfileInclude, DigitalAssetInclude, OwnedTokenNftInclude).
 */

/** ProfileInclude — 9 fields. Used on profiles, nfts (holder), owned-assets, owned-tokens. */
export const PROFILE_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'tags', label: 'Tags' },
  { key: 'links', label: 'Links' },
  { key: 'avatar', label: 'Avatar' },
  { key: 'profileImage', label: 'Profile Image' },
  { key: 'backgroundImage', label: 'Background Image' },
  { key: 'followerCount', label: 'Follower Count' },
  { key: 'followingCount', label: 'Following Count' },
];

/** DigitalAssetInclude — 17 fields. Used on digital-assets, nfts (collection), owned-assets, owned-tokens. */
export const DIGITAL_ASSET_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'tokenType', label: 'Token Type' },
  { key: 'decimals', label: 'Decimals' },
  { key: 'totalSupply', label: 'Total Supply' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'icons', label: 'Icons' },
  { key: 'images', label: 'Images' },
  { key: 'links', label: 'Links' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'owner', label: 'Owner' },
  { key: 'holderCount', label: 'Holder Count' },
  { key: 'creatorCount', label: 'Creator Count' },
  { key: 'referenceContract', label: 'Reference Contract' },
  { key: 'tokenIdFormat', label: 'Token ID Format' },
  { key: 'baseUri', label: 'Base URI' },
];

/** OwnedTokenOwnedAssetInclude — 3 fields. Used on owned-tokens (nested ownedAsset relation). */
export const OWNED_ASSET_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'balance', label: 'Balance' },
  { key: 'block', label: 'Block' },
  { key: 'timestamp', label: 'Timestamp' },
];

/** OwnedTokenNftInclude — 8 fields (excludes collection/holder). Used on nfts, owned-tokens. */
export const NFT_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'formattedTokenId', label: 'Formatted Token ID' },
  { key: 'name', label: 'NFT Name' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'icons', label: 'Icons' },
  { key: 'images', label: 'Images' },
  { key: 'links', label: 'Links' },
  { key: 'attributes', label: 'Attributes' },
];

/** FollowerInclude — 2 scalar fields. followerProfile/followedProfile are SubIncludeSections. */
export const FOLLOWER_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'address', label: 'Contract Address' },
];

/** CreatorInclude — 3 scalar fields. creatorProfile/digitalAsset are SubIncludeSections. */
export const CREATOR_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'arrayIndex', label: 'Array Index' },
  { key: 'interfaceId', label: 'Interface ID' },
  { key: 'timestamp', label: 'Timestamp' },
];

/** IssuedAssetInclude — 3 scalar fields. issuerProfile/digitalAsset are SubIncludeSections. */
export const ISSUED_ASSET_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'arrayIndex', label: 'Array Index' },
  { key: 'interfaceId', label: 'Interface ID' },
  { key: 'timestamp', label: 'Timestamp' },
];

/** EncryptedAssetInclude — 7 boolean fields. encryption sub-include and universalProfile are SubIncludeSections. */
export const ENCRYPTED_ASSET_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'arrayIndex', label: 'Array Index' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'file', label: 'File' },
  { key: 'chunks', label: 'Chunks' },
  { key: 'images', label: 'Images' },
];

/** EncryptedAssetEncryptionInclude — 1 field (accessControlConditions). Used in encryption sub-include. */
export const ENCRYPTED_ASSET_ENCRYPTION_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'accessControlConditions', label: 'Access Control Conditions' },
];
