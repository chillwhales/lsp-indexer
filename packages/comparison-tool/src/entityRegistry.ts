import { ComparisonMode, EntityDefinition, IdStrategy, KnownDivergence } from './types';

/**
 * Convert PascalCase entity name to snake_case Hasura table name.
 * Matches Subsquid's inflected.underscore() algorithm:
 *   1. Insert _ between consecutive uppercase+digit runs and camelCase: ERC725YData → ERC725_Y_Data
 *   2. Insert _ at lowercase/digit → uppercase boundary: ProfileImage → Profile_Image
 */
function toSnakeCase(name: string): string {
  return name
    .replace(/([A-Z\d]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/** Options for the entity factory when more than just isMetadataSub is needed. */
interface EntityOpts {
  isMetadataSub?: boolean;
  idStrategy?: IdStrategy;
  naturalKey?: string[];
  parentFk?: string;
}

function entity(
  name: string,
  category: EntityDefinition['category'],
  opts?: boolean | EntityOpts,
): EntityDefinition {
  // Handle backward-compatible boolean form: entity('Foo', 'metadata', true)
  const options: EntityOpts = typeof opts === 'boolean' ? { isMetadataSub: opts } : (opts ?? {});
  return {
    name,
    hasuraTable: toSnakeCase(name),
    primaryKey: 'id',
    category,
    isMetadataSub: options.isMetadataSub ?? false,
    idStrategy: options.idStrategy ?? 'address',
    naturalKey: options.naturalKey,
    parentFk: options.parentFk,
  };
}

/**
 * Natural key for UUID event entities.
 * block_number + log_index is globally unique within a chain.
 */
const EVENT_NATURAL_KEY = ['block_number', 'log_index'];

/** Shorthand options for UUID event entities. */
const uuid: EntityOpts = { idStrategy: 'uuid', naturalKey: EVENT_NATURAL_KEY };

/** Shorthand options for metadata sub-entities with parent FK for ordered sampling. */
const lsp3Sub: EntityOpts = { isMetadataSub: true, parentFk: 'lsp3_profile_id' };
const lsp4Sub: EntityOpts = { isMetadataSub: true, parentFk: 'lsp4_metadata_id' };
const lsp29Sub: EntityOpts = { isMetadataSub: true, parentFk: 'lsp29_encrypted_asset_id' };

export const ENTITY_REGISTRY: EntityDefinition[] = [
  // Core entities (address or composite IDs — deterministic, matched by ID)
  entity('UniversalProfile', 'core'),
  entity('DigitalAsset', 'core'),
  entity('TotalSupply', 'core'),
  entity('Decimals', 'core'),
  entity('NFT', 'core', { idStrategy: 'composite' }),
  entity('OwnedAsset', 'core', { idStrategy: 'composite' }),
  entity('OwnedToken', 'core', { idStrategy: 'composite' }),

  // Event entities (UUID IDs — non-deterministic, matched by block_number + log_index)
  entity('Executed', 'event', uuid),
  entity('UniversalReceiver', 'event', uuid),
  entity('Follow', 'event', uuid),
  entity('Follower', 'event', { idStrategy: 'composite' }),
  entity('Unfollow', 'event', uuid),
  entity('DataChanged', 'event', uuid),
  entity('TokenIdDataChanged', 'event', uuid),
  entity('Transfer', 'event', uuid),
  entity('DeployedContracts', 'event', uuid),
  entity('DeployedERC1167Proxies', 'event', uuid),
  entity('OwnershipTransferred', 'event', uuid),

  // Ownership entities (address IDs)
  entity('UniversalProfileOwner', 'ownership'),
  entity('DigitalAssetOwner', 'ownership'),

  // LSP3 Profile metadata
  entity('LSP3Profile', 'metadata'),
  entity('LSP3ProfileName', 'metadata', lsp3Sub),
  entity('LSP3ProfileDescription', 'metadata', lsp3Sub),
  entity('LSP3ProfileTag', 'metadata', lsp3Sub),
  entity('LSP3ProfileLink', 'metadata', lsp3Sub),
  entity('LSP3ProfileAsset', 'metadata', lsp3Sub),
  entity('LSP3ProfileImage', 'metadata', lsp3Sub),
  entity('LSP3ProfileBackgroundImage', 'metadata', lsp3Sub),

  // LSP4 Asset metadata
  entity('LSP4Metadata', 'metadata'),
  entity('LSP4MetadataName', 'metadata', lsp4Sub),
  entity('LSP4MetadataDescription', 'metadata', lsp4Sub),
  entity('LSP4MetadataScore', 'metadata', lsp4Sub),
  entity('LSP4MetadataRank', 'metadata', lsp4Sub),
  entity('LSP4MetadataCategory', 'metadata', lsp4Sub),
  entity('LSP4MetadataLink', 'metadata', lsp4Sub),
  entity('LSP4MetadataIcon', 'metadata', lsp4Sub),
  entity('LSP4MetadataImage', 'metadata', lsp4Sub),
  entity('LSP4MetadataAsset', 'metadata', lsp4Sub),
  entity('LSP4MetadataAttribute', 'metadata', lsp4Sub),

  // LSP29 Encrypted Asset metadata
  entity('LSP29EncryptedAsset', 'metadata'),
  entity('LSP29EncryptedAssetTitle', 'metadata', lsp29Sub),
  entity('LSP29EncryptedAssetDescription', 'metadata', lsp29Sub),
  entity('LSP29EncryptedAssetFile', 'metadata', lsp29Sub),
  entity('LSP29EncryptedAssetEncryption', 'metadata', lsp29Sub),
  entity('LSP29AccessControlCondition', 'metadata', {
    isMetadataSub: true,
    parentFk: 'encryption_id',
  }),
  entity('LSP29EncryptedAssetChunks', 'metadata', lsp29Sub),
  entity('LSP29EncryptedAssetImage', 'metadata', lsp29Sub),
  entity('LSP29EncryptedAssetRevisionCount', 'metadata', lsp29Sub),
  entity('LSP29EncryptedAssetsLength', 'metadata', lsp29Sub),
  entity('LSP29EncryptedAssetEntry', 'metadata', lsp29Sub),

  // LSP4 token properties
  entity('LSP4TokenName', 'lsp'),
  entity('LSP4TokenSymbol', 'lsp'),
  entity('LSP4TokenType', 'lsp'),
  entity('LSP4CreatorsLength', 'lsp'),
  entity('LSP4Creator', 'lsp'),

  // LSP5 received assets
  entity('LSP5ReceivedAssetsLength', 'lsp'),
  entity('LSP5ReceivedAsset', 'lsp'),

  // LSP6 permissions/controllers
  entity('LSP6ControllersLength', 'lsp'),
  entity('LSP6Controller', 'lsp'),
  entity('LSP6Permission', 'lsp'),
  entity('LSP6AllowedCall', 'lsp'),
  entity('LSP6AllowedERC725YDataKey', 'lsp'),

  // LSP8 token properties
  entity('LSP8TokenIdFormat', 'lsp'),
  entity('LSP8ReferenceContract', 'lsp'),
  entity('LSP8TokenMetadataBaseURI', 'lsp'),

  // LSP12 issued assets
  entity('LSP12IssuedAssetsLength', 'lsp'),
  entity('LSP12IssuedAsset', 'lsp'),

  // Custom chillwhales/ORBS entities
  entity('ChillClaimed', 'custom'),
  entity('OrbsClaimed', 'custom'),
  entity('OrbLevel', 'custom'),
  entity('OrbCooldownExpiry', 'custom'),
  entity('OrbFaction', 'custom'),
];

/**
 * Known divergences for v1-v2 cross-version comparison.
 * In v2-v2 mode, no divergences apply — any diff is a bug.
 */
const V1_V2_DIVERGENCES: KnownDivergence[] = [
  // --- Field-level divergences (V2 behaviour differs from V1) ---

  {
    entityType: 'NFT',
    field: 'formatted_token_id',
    reason: 'V2 returns null for unknown LSP8 token ID formats (V1 returned raw tokenId)',
  },

  // V2 Step 7 (RESOLVE) populates reverse FK fields that V1 never populated.
  // Core entities:
  {
    entityType: 'UniversalProfile',
    field: 'lsp3_profile_id',
    reason: 'V2 populates reverse FK to LSP3Profile via Step 7 RESOLVE; V1 leaves null',
  },
  {
    entityType: 'DigitalAsset',
    field: 'lsp4_metadata_id',
    reason:
      'V2 populates reverse FK to contract-level LSP4Metadata via Step 7 RESOLVE; V1 leaves null',
  },
  {
    entityType: 'NFT',
    field: 'lsp4_metadata_id',
    reason: 'V2 populates reverse FK to per-token LSP4Metadata via Step 7 RESOLVE; V1 leaves null',
  },
  {
    entityType: 'NFT',
    field: 'lsp4_metadata_base_uri_id',
    reason:
      'V2 populates reverse FK to BaseURI-derived LSP4Metadata via Step 7 RESOLVE; V1 leaves null',
  },
  // Event entities — V2 resolves FK fields V1 never populated:
  {
    entityType: 'UniversalReceiver',
    field: 'from_profile_id',
    reason: 'V2 populates FK to sender UniversalProfile; V1 leaves null',
  },
  {
    entityType: 'DeployedContracts',
    field: 'universal_profile_id',
    reason: 'V2 populates FK to deployer UniversalProfile; V1 leaves null',
  },
  {
    entityType: 'DeployedERC1167Proxies',
    field: 'universal_profile_id',
    reason: 'V2 populates FK to deployer UniversalProfile; V1 leaves null',
  },
  {
    entityType: 'OwnershipTransferred',
    field: 'new_owner_profile_id',
    reason: 'V2 populates FK to new owner UniversalProfile; V1 leaves null',
  },
  {
    entityType: 'OwnershipTransferred',
    field: 'previous_owner_profile_id',
    reason: 'V2 populates FK to previous owner UniversalProfile; V1 leaves null',
  },

  // Metadata fetch error format differences — V2 uses different error messages
  {
    entityType: 'LSP4Metadata',
    field: 'fetch_error_message',
    reason:
      'V2 produces different error message text (e.g., "TypeError: Invalid URL" vs "Error: Missing URL")',
  },
  {
    entityType: 'LSP4Metadata',
    field: 'fetch_error_code',
    reason: 'V2 may populate fetch_error_code where V1 left null (WORKER_POOL_ERROR, etc.)',
  },
  {
    entityType: 'LSP4Metadata',
    field: 'is_data_fetched',
    reason: 'V2 may mark failed fetches as is_data_fetched=false where V1 marked true',
  },
  {
    entityType: 'LSP4Metadata',
    field: 'retry_count',
    reason: 'V2 tracks retry_count for failed fetches; V1 leaves null',
  },
  {
    entityType: 'LSP29EncryptedAsset',
    field: 'fetch_error_message',
    reason:
      'V2 produces different error message text (e.g., "TypeError: Invalid URL" vs "Error: Missing URL")',
  },

  // --- Count-level divergences (row count differences) ---

  // V1 balance underflow bug: negative balances fall through both save AND delete
  // filters in V1 (ownedAsset.ts:40), preserving stale rows. V2 floors to 0 and
  // correctly deletes zero-balance rows — so V1 has more rows than V2.
  {
    entityType: 'OwnedAsset',
    field: 'count',
    reason:
      'V1 balance underflow bug preserves stale rows with negative balances; V2 floors to 0 and correctly deletes',
  },
  {
    entityType: 'OwnedToken',
    field: 'count',
    reason:
      'V1 balance underflow bug preserves stale rows with negative balances; V2 floors to 0 and correctly deletes',
  },
  // V1 switch fall-through bugs in scanner.ts:203-229 — missing `break` statements
  // cause DataChanged events for LSP4Creators[].length, LSP5ReceivedAssets[].length,
  // AddressPermissions[].length to fall through into unrelated entity handlers.
  {
    entityType: 'LSP5ReceivedAssetsLength',
    field: 'count',
    reason:
      'V1 switch fall-through bug creates phantom entities from unrelated DataChanged events (AddressPermissions[].length falls through)',
  },
  // LSP6ControllersLength — V1 has inflated values due to switch fall-through.
  // Rows that exist in both V1 and V2 have different raw_value/value/timestamp.
  {
    entityType: 'LSP6ControllersLength',
    field: 'count',
    reason:
      'V1 switch fall-through bug creates phantom entities from unrelated DataChanged events (LSP4Creators[].length, LSP5ReceivedAssets[].length fall through)',
  },
  {
    entityType: 'LSP6ControllersLength',
    field: 'raw_value',
    reason: 'V1 switch fall-through inflates AddressPermissions[].length values',
  },
  {
    entityType: 'LSP6ControllersLength',
    field: 'value',
    reason: 'V1 switch fall-through inflates AddressPermissions[].length values',
  },
  {
    entityType: 'LSP6ControllersLength',
    field: 'timestamp',
    reason: 'V1 switch fall-through processes unrelated events, updating timestamp to wrong value',
  },
  {
    entityType: 'LSP6Permission',
    field: 'count',
    reason:
      'V1 switch fall-through inflates AddressPermissions[].length, creating phantom controller entries whose permissions are then indexed — V2 has correct counts',
  },
  {
    entityType: 'LSP6AllowedCall',
    field: 'count',
    reason:
      'V1 switch fall-through inflates AddressPermissions[].length, creating phantom controller entries whose allowed calls are then indexed — V2 has correct counts',
  },
  {
    entityType: 'LSP8ReferenceContract',
    field: 'count',
    reason:
      'V1 switch fall-through bug creates phantom entities from unrelated DataChanged events (LSP4Creators[].length, LSP5ReceivedAssets[].length, AddressPermissions[].length fall through to LSP8ReferenceContract case)',
  },
  // V2-only entities: these entity types exist only in V2.
  // V1 has 0 rows — count divergence is expected.
  {
    entityType: 'LSP4Creator',
    field: 'count',
    reason: 'V2-only entity — V1 does not index LSP4Creator as a separate entity',
  },
  {
    entityType: 'LSP5ReceivedAsset',
    field: 'count',
    reason: 'V2-only entity — V1 does not index LSP5ReceivedAsset as a separate entity',
  },
  {
    entityType: 'LSP6Controller',
    field: 'count',
    reason: 'V2-only entity — V1 does not index LSP6Controller as a separate entity',
  },
  {
    entityType: 'LSP12IssuedAsset',
    field: 'count',
    reason: 'V2-only entity — V1 does not index LSP12IssuedAsset as a separate entity',
  },
  {
    entityType: 'Follower',
    field: 'count',
    reason: 'V2-only entity — V1 does not index Follower as a separate entity',
  },

  // --- Sync-level divergences (V1 & V2 at different block heights) ---

  // UniversalProfile, DigitalAsset, Decimals, UniversalProfileOwner, DigitalAssetOwner,
  // LSP4Metadata, Follow count differences are due to V1 being at a different sync height.
  // These are transient and will converge once both indexers reach the same block.
  {
    entityType: 'UniversalProfile',
    field: 'count',
    reason: 'V1 and V2 at different sync heights — count will converge',
  },
  {
    entityType: 'DigitalAsset',
    field: 'count',
    reason: 'V1 and V2 at different sync heights — count will converge',
  },
  {
    entityType: 'Decimals',
    field: 'count',
    reason: 'V1 and V2 at different sync heights — count will converge',
  },
  {
    entityType: 'UniversalProfileOwner',
    field: 'count',
    reason: 'V1 and V2 at different sync heights — count will converge',
  },
  {
    entityType: 'DigitalAssetOwner',
    field: 'count',
    reason: 'V1 and V2 at different sync heights — count will converge',
  },
  {
    entityType: 'LSP4Metadata',
    field: 'count',
    reason: 'V1 and V2 at different sync heights — count will converge',
  },
  {
    entityType: 'Follow',
    field: 'count',
    reason:
      'V1 double-counts Follow events (V1: 123,676 vs V2: 62,142); V2 correct — also V1/V2 at different sync heights',
  },
];

export function getEntityByName(name: string): EntityDefinition | undefined {
  return ENTITY_REGISTRY.find((e) => e.name === name);
}

export function getKnownDivergences(entityType: string, mode: ComparisonMode): KnownDivergence[] {
  if (mode === 'v2-v2') {
    return []; // No known divergences between identical versions
  }
  return V1_V2_DIVERGENCES.filter((d) => d.entityType === entityType);
}
