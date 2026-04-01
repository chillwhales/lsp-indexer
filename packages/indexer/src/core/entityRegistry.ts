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
} from '@/model';
import { FindManyOptions, Store } from '@subsquid/typeorm-store';
import { FindOptionsWhere, In } from 'typeorm';

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
export const ENTITY_CONSTRUCTORS: {
  [K in keyof EntityRegistry]: new (props?: Partial<EntityRegistry[K]>) => EntityRegistry[K];
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
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetImage,
};

// ---------------------------------------------------------------------------
// Runtime accessors
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
export function getEntityConstructor<K extends keyof EntityRegistry>(
  key: K,
): new (props?: Partial<EntityRegistry[K]>) => EntityRegistry[K] {
  return ENTITY_CONSTRUCTORS[key];
}

/**
 * Create a new entity instance for a bag key.
 *
 * Uses the registry constructor to instantiate the entity with the given
 * partial props. The generic `K` keeps the type deferred, so TypeScript
 * resolves the constructor as compatible with `EntityClass<EntityRegistry[K]>`
 * without expanding the 73-member union.
 *
 * @param key   - A valid bag key (keyof EntityRegistry)
 * @param props - Partial entity properties (typically just `{ id }` for FK stubs)
 * @returns A new entity instance of the correct type for the bag key
 */
export function createEntity<K extends keyof EntityRegistry>(
  key: K,
  props?: Partial<EntityRegistry[K]>,
): EntityRegistry[K] {
  const ctor = ENTITY_CONSTRUCTORS[key];
  return new ctor(props);
}

/**
 * Query entities from the store by bag key using `store.find()`.
 *
 * Wraps the Subsquid store query with the registry constructor so callers
 * don't need type casts. The generic `K` keeps the constructor type deferred,
 * making it compatible with `EntityClass<EntityRegistry[K]>`.
 *
 * @param store   - Subsquid store instance
 * @param key     - A valid bag key (keyof EntityRegistry)
 * @param options - TypeORM FindManyOptions (where, order, relations, etc.)
 * @returns Array of entities matching the query
 */
export async function storeFind<K extends keyof EntityRegistry>(
  store: Store,
  key: K,
  options?: FindManyOptions<EntityRegistry[K]>,
): Promise<EntityRegistry[K][]> {
  const ctor = ENTITY_CONSTRUCTORS[key];
  return store.find(ctor, options);
}

/**
 * Query entities from the store by bag key using `store.findBy()`.
 *
 * Like {@link storeFind} but takes a where clause directly instead of
 * a full options object. Useful for simple ID-based lookups.
 *
 * @param store - Subsquid store instance
 * @param key   - A valid bag key (keyof EntityRegistry)
 * @param where - TypeORM FindOptionsWhere condition(s)
 * @returns Array of entities matching the where clause
 */
export async function storeFindBy<K extends keyof EntityRegistry>(
  store: Store,
  key: K,
  where: FindOptionsWhere<EntityRegistry[K]>,
): Promise<EntityRegistry[K][]> {
  const ctor = ENTITY_CONSTRUCTORS[key];
  return store.findBy(ctor, where);
}

/**
 * Query a single entity from the store by bag key using `store.findOneBy()`.
 *
 * Like {@link storeFindBy} but returns a single entity or undefined.
 *
 * @param store - Subsquid store instance
 * @param key   - A valid bag key (keyof EntityRegistry)
 * @param where - TypeORM FindOptionsWhere condition(s)
 * @returns The matching entity, or undefined if not found
 */
export async function storeFindOneBy<K extends keyof EntityRegistry>(
  store: Store,
  key: K,
  where: FindOptionsWhere<EntityRegistry[K]>,
): Promise<EntityRegistry[K] | undefined> {
  const ctor = ENTITY_CONSTRUCTORS[key];
  return store.findOneBy(ctor, where);
}

/**
 * Find a single entity by ID using the registry constructor.
 *
 * Accepts a plain `id` string instead of `FindOptionsWhere<EntityRegistry[K]>`,
 * avoiding the deferred-generic mapped type issue where TypeScript cannot verify
 * `{ id: string }` against `FindOptionsWhere<EntityRegistry[K]>` when `K` is
 * an unresolved type parameter (see: https://github.com/microsoft/TypeScript/issues/53620).
 *
 * The internal cast is sound: all EntityRegistry values have `id: string`,
 * enforced by TypeORM's Entity interface and our codegen.
 *
 * @param store - Subsquid store instance
 * @param key   - A valid bag key (keyof EntityRegistry)
 * @param id    - Entity ID to look up
 * @returns The matching entity, or undefined if not found
 */
export async function storeFindOneById<K extends keyof EntityRegistry>(
  store: Store,
  key: K,
  id: string,
): Promise<EntityRegistry[K] | undefined> {
  const ctor = ENTITY_CONSTRUCTORS[key];
  return store.findOneBy(ctor, { id } as FindOptionsWhere<EntityRegistry[K]>);
}

/**
 * Find multiple entities by IDs using the registry constructor.
 *
 * Accepts a plain `ids` array instead of `FindOptionsWhere<EntityRegistry[K]>`,
 * avoiding the same deferred-generic mapped type issue as {@link storeFindOneById}.
 *
 * @param store - Subsquid store instance
 * @param key   - A valid bag key (keyof EntityRegistry)
 * @param ids   - Entity IDs to look up
 * @returns Array of entities matching the given IDs
 */
export async function storeFindByIds<K extends keyof EntityRegistry>(
  store: Store,
  key: K,
  ids: string[],
): Promise<EntityRegistry[K][]> {
  const ctor = ENTITY_CONSTRUCTORS[key];
  return store.findBy(ctor, { id: In(ids) } as FindOptionsWhere<EntityRegistry[K]>);
}
