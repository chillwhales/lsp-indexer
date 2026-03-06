import { EntityDefinition, IdStrategy } from './types';

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

export function getEntityByName(name: string): EntityDefinition | undefined {
  return ENTITY_REGISTRY.find((e) => e.name === name);
}
