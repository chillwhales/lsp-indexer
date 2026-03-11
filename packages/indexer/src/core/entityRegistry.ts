/**
 * Entity Registry — single source of truth for all BatchContext bag keys.
 *
 * Maps every bag key to its concrete TypeORM entity class, both at the type
 * level (EntityRegistry interface) and at runtime (ENTITY_CONSTRUCTORS map).
 *
 * This replaces `entityTypeMap.ts` entirely. The old file had a partial map
 * (~15 entries) with a separate `getTypedEntities()` function. This file
 * provides the complete 71-entry registry and typed accessors are now built
 * into BatchContext itself (`addEntity<K>` / `getEntities<K>`).
 *
 * When adding a new event plugin or handler that introduces a new bag key:
 * 1. Import the entity class from @chillwhales/typeorm
 * 2. Add the key → type mapping to EntityRegistry
 * 3. Add the key → constructor mapping to ENTITY_CONSTRUCTORS
 *
 * The compiler enforces that both maps stay in sync.
 */
import {
  ChillClaimed,
  DataChanged,
  Decimals,
  DeployedContracts,
  DeployedERC1167Proxies,
  DigitalAsset,
  DigitalAssetOwner,
  Executed,
  Follow,
  Follower,
  LSP12IssuedAsset,
  LSP12IssuedAssetsLength,
  LSP29AccessControlCondition,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetEncryption,
  LSP29EncryptedAssetEntry,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetImage,
  LSP29EncryptedAssetRevisionCount,
  LSP29EncryptedAssetTitle,
  LSP29EncryptedAssetsLength,
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
  LSP4Creator,
  LSP4CreatorsLength,
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataCategory,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
  LSP4MetadataRank,
  LSP4MetadataScore,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP5ReceivedAsset,
  LSP5ReceivedAssetsLength,
  LSP6AllowedCall,
  LSP6AllowedERC725YDataKey,
  LSP6Controller,
  LSP6ControllersLength,
  LSP6Permission,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  LSP8TokenMetadataBaseURI,
  NFT,
  OrbCooldownExpiry,
  OrbFaction,
  OrbLevel,
  OrbsClaimed,
  OwnedAsset,
  OwnedToken,
  OwnershipTransferred,
  TokenIdDataChanged,
  TotalSupply,
  Transfer,
  Unfollow,
  UniversalProfile,
  UniversalProfileOwner,
  UniversalReceiver,
} from '@chillwhales/typeorm';

// ---------------------------------------------------------------------------
// Type-level registry
// ---------------------------------------------------------------------------

/**
 * Maps every BatchContext bag key to its concrete TypeORM entity type.
 *
 * This is the schema of the entity bag — it documents which string keys
 * correspond to which TypeORM entities at the type level.
 *
 * Used as a generic constraint on `addEntity<K>` and `getEntities<K>` so
 * that bag key typos are compile errors and entity type mismatches are
 * caught at compile time.
 */
export interface EntityRegistry {
  // Core entities (created by verification, Step 5)
  UniversalProfile: UniversalProfile;
  DigitalAsset: DigitalAsset;

  // Event entities (from plugins, Step 1 EXTRACT)
  DataChanged: DataChanged;
  TokenIdDataChanged: TokenIdDataChanged;
  LSP7Transfer: Transfer;
  LSP8Transfer: Transfer;
  Follow: Follow;
  Unfollow: Unfollow;
  OwnershipTransferred: OwnershipTransferred;
  UniversalReceiver: UniversalReceiver;
  Executed: Executed;
  DeployedERC1167Proxies: DeployedERC1167Proxies;
  DeployedContracts: DeployedContracts;

  // Data key / derived handlers (Step 3 HANDLE)
  LSP4TokenName: LSP4TokenName;
  LSP4TokenSymbol: LSP4TokenSymbol;
  LSP4TokenType: LSP4TokenType;
  LSP4Metadata: LSP4Metadata;
  LSP4Creator: LSP4Creator;
  LSP4CreatorsLength: LSP4CreatorsLength;
  LSP3Profile: LSP3Profile;
  LSP5ReceivedAsset: LSP5ReceivedAsset;
  LSP5ReceivedAssetsLength: LSP5ReceivedAssetsLength;
  LSP8TokenIdFormat: LSP8TokenIdFormat;
  LSP8TokenMetadataBaseURI: LSP8TokenMetadataBaseURI;
  LSP8ReferenceContract: LSP8ReferenceContract;
  LSP12IssuedAsset: LSP12IssuedAsset;
  LSP12IssuedAssetsLength: LSP12IssuedAssetsLength;
  LSP6Controller: LSP6Controller;
  LSP6ControllersLength: LSP6ControllersLength;
  LSP6Permission: LSP6Permission;
  LSP6AllowedCall: LSP6AllowedCall;
  LSP6AllowedERC725YDataKey: LSP6AllowedERC725YDataKey;
  NFT: NFT;
  TotalSupply: TotalSupply;
  Follower: Follower;
  Decimals: Decimals;
  DigitalAssetOwner: DigitalAssetOwner;
  UniversalProfileOwner: UniversalProfileOwner;
  OwnedAsset: OwnedAsset;
  OwnedToken: OwnedToken;
  LSP29EncryptedAsset: LSP29EncryptedAsset;
  LSP29EncryptedAssetEntry: LSP29EncryptedAssetEntry;
  LSP29EncryptedAssetRevisionCount: LSP29EncryptedAssetRevisionCount;
  LSP29EncryptedAssetsLength: LSP29EncryptedAssetsLength;

  // ChillWhales handlers
  OrbsClaimed: OrbsClaimed;
  ChillClaimed: ChillClaimed;
  OrbLevel: OrbLevel;
  OrbFaction: OrbFaction;
  OrbCooldownExpiry: OrbCooldownExpiry;

  // LSP3 metadata sub-entities (from lsp3ProfileFetch.handler.ts)
  LSP3ProfileName: LSP3ProfileName;
  LSP3ProfileDescription: LSP3ProfileDescription;
  LSP3ProfileTag: LSP3ProfileTag;
  LSP3ProfileLink: LSP3ProfileLink;
  LSP3ProfileAsset: LSP3ProfileAsset;
  LSP3ProfileImage: LSP3ProfileImage;
  LSP3ProfileBackgroundImage: LSP3ProfileBackgroundImage;

  // LSP4 metadata sub-entities (from lsp4MetadataFetch.handler.ts)
  LSP4MetadataName: LSP4MetadataName;
  LSP4MetadataDescription: LSP4MetadataDescription;
  LSP4MetadataCategory: LSP4MetadataCategory;
  LSP4MetadataLink: LSP4MetadataLink;
  LSP4MetadataImage: LSP4MetadataImage;
  LSP4MetadataIcon: LSP4MetadataIcon;
  LSP4MetadataAsset: LSP4MetadataAsset;
  LSP4MetadataAttribute: LSP4MetadataAttribute;
  LSP4MetadataScore: LSP4MetadataScore;
  LSP4MetadataRank: LSP4MetadataRank;

  // LSP29 metadata sub-entities (from lsp29EncryptedAssetFetch.handler.ts)
  LSP29EncryptedAssetTitle: LSP29EncryptedAssetTitle;
  LSP29EncryptedAssetDescription: LSP29EncryptedAssetDescription;
  LSP29EncryptedAssetFile: LSP29EncryptedAssetFile;
  LSP29EncryptedAssetEncryption: LSP29EncryptedAssetEncryption;
  LSP29AccessControlCondition: LSP29AccessControlCondition;
  LSP29EncryptedAssetChunks: LSP29EncryptedAssetChunks;
  LSP29EncryptedAssetImage: LSP29EncryptedAssetImage;
}

// ---------------------------------------------------------------------------
// Convenience type alias
// ---------------------------------------------------------------------------

/** Union of all valid bag keys. */
export type BagKey = keyof EntityRegistry;

/** Union of all registered entity types — the value-side counterpart of BagKey. */
export type RegisteredEntity = EntityRegistry[BagKey];

// ---------------------------------------------------------------------------
// Runtime constructor registry
// ---------------------------------------------------------------------------

/**
 * Runtime mapping of bag keys to entity constructors.
 *
 * Used by BatchContext for `instanceof` validation on `addEntity` and
 * `getEntities`, and by `getEntityConstructor()` for DB queries in
 * handlerHelpers.
 *
 * The mapped type ensures the compiler rejects any mismatch between the
 * interface and the runtime map.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ENTITY_CONSTRUCTORS: {
  [K in keyof EntityRegistry]: new (...args: any[]) => EntityRegistry[K];
} = {
  // Core entities
  UniversalProfile,
  DigitalAsset,

  // Event entities
  DataChanged,
  TokenIdDataChanged,
  LSP7Transfer: Transfer,
  LSP8Transfer: Transfer,
  Follow,
  Unfollow,
  OwnershipTransferred,
  UniversalReceiver,
  Executed,
  DeployedERC1167Proxies,
  DeployedContracts,

  // Data key / derived handlers
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP4Metadata,
  LSP4Creator,
  LSP4CreatorsLength,
  LSP3Profile,
  LSP5ReceivedAsset,
  LSP5ReceivedAssetsLength,
  LSP8TokenIdFormat,
  LSP8TokenMetadataBaseURI,
  LSP8ReferenceContract,
  LSP12IssuedAsset,
  LSP12IssuedAssetsLength,
  LSP6Controller,
  LSP6ControllersLength,
  LSP6Permission,
  LSP6AllowedCall,
  LSP6AllowedERC725YDataKey,
  NFT,
  TotalSupply,
  Follower,
  Decimals,
  DigitalAssetOwner,
  UniversalProfileOwner,
  OwnedAsset,
  OwnedToken,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetEntry,
  LSP29EncryptedAssetRevisionCount,
  LSP29EncryptedAssetsLength,

  // ChillWhales handlers
  OrbsClaimed,
  ChillClaimed,
  OrbLevel,
  OrbFaction,
  OrbCooldownExpiry,

  // LSP3 metadata sub-entities
  LSP3ProfileName,
  LSP3ProfileDescription,
  LSP3ProfileTag,
  LSP3ProfileLink,
  LSP3ProfileAsset,
  LSP3ProfileImage,
  LSP3ProfileBackgroundImage,

  // LSP4 metadata sub-entities
  LSP4MetadataName,
  LSP4MetadataDescription,
  LSP4MetadataCategory,
  LSP4MetadataLink,
  LSP4MetadataImage,
  LSP4MetadataIcon,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataScore,
  LSP4MetadataRank,

  // LSP29 metadata sub-entities
  LSP29EncryptedAssetTitle,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetEncryption,
  LSP29AccessControlCondition,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetImage,
};

// ---------------------------------------------------------------------------
// Runtime accessor
// ---------------------------------------------------------------------------

/**
 * Get the entity constructor for a bag key from the runtime registry.
 *
 * Used by `handlerHelpers.ts` for DB queries (store.findOneBy, store.findBy)
 * instead of requiring callers to pass the entity class explicitly.
 *
 * @param key - A valid bag key (keyof EntityRegistry)
 * @returns The TypeORM entity class constructor for that bag key
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEntityConstructor<K extends keyof EntityRegistry>(
  key: K,
): new (...args: any[]) => EntityRegistry[K] {
  return ENTITY_CONSTRUCTORS[key];
}
