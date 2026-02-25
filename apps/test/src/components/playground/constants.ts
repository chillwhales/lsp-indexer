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

/** EncryptedAssetInclude — 5 boolean fields. encryption/file/chunks are SubIncludeSections, universalProfile too. */
export const ENCRYPTED_ASSET_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'arrayIndex', label: 'Array Index' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'images', label: 'Images' },
];

/** EncryptedAssetEncryptionInclude — 6 fields. Used in encryption sub-include. */
export const ENCRYPTED_ASSET_ENCRYPTION_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'method', label: 'Method' },
  { key: 'ciphertext', label: 'Ciphertext' },
  { key: 'dataToEncryptHash', label: 'Data To Encrypt Hash' },
  { key: 'decryptionCode', label: 'Decryption Code' },
  { key: 'decryptionParams', label: 'Decryption Params' },
  { key: 'accessControlConditions', label: 'Access Control Conditions' },
];

/** EncryptedAssetFileInclude — 4 fields (name is always included). Used in file sub-include. */
export const ENCRYPTED_ASSET_FILE_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'type', label: 'Type' },
  { key: 'size', label: 'Size' },
  { key: 'lastModified', label: 'Last Modified' },
  { key: 'hash', label: 'Hash' },
];

/** EncryptedAssetChunksInclude — 3 fields. Used in chunks sub-include. */
export const ENCRYPTED_ASSET_CHUNKS_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'cids', label: 'CIDs' },
  { key: 'iv', label: 'IV' },
  { key: 'totalSize', label: 'Total Size' },
];

/** DataChangedEventInclude — 4 scalar fields. universalProfile/digitalAsset are SubIncludeSections. */
export const DATA_CHANGED_EVENT_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'blockNumber', label: 'Block Number' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'logIndex', label: 'Log Index' },
  { key: 'transactionIndex', label: 'Transaction Index' },
];

/** TokenIdDataChangedEventInclude — 4 scalar fields + nft boolean. digitalAsset is SubIncludeSection. */
export const TOKEN_ID_DATA_CHANGED_EVENT_INCLUDE_FIELDS: IncludeToggleConfig[] = [
  { key: 'blockNumber', label: 'Block Number' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'logIndex', label: 'Log Index' },
  { key: 'transactionIndex', label: 'Transaction Index' },
  { key: 'nft', label: 'NFT Info' },
];
