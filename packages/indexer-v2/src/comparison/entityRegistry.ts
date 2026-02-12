import { EntityDefinition, KnownDivergence } from './types';

/**
 * Convert PascalCase entity name to snake_case Hasura table name.
 * Handles consecutive capitals correctly: LSP3ProfileImage → lsp3_profile_image
 * Insert underscore before capital letter only if previous char was lowercase or digit
 */
function toSnakeCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export const ENTITY_REGISTRY: EntityDefinition[] = [
  // Core entities
  {
    name: 'UniversalProfile',
    hasuraTable: toSnakeCase('UniversalProfile'),
    primaryKey: 'id',
    category: 'core',
    isMetadataSub: false,
  },
  {
    name: 'DigitalAsset',
    hasuraTable: toSnakeCase('DigitalAsset'),
    primaryKey: 'id',
    category: 'core',
    isMetadataSub: false,
  },
  {
    name: 'TotalSupply',
    hasuraTable: toSnakeCase('TotalSupply'),
    primaryKey: 'id',
    category: 'core',
    isMetadataSub: false,
  },
  {
    name: 'Decimals',
    hasuraTable: toSnakeCase('Decimals'),
    primaryKey: 'id',
    category: 'core',
    isMetadataSub: false,
  },
  {
    name: 'NFT',
    hasuraTable: toSnakeCase('NFT'),
    primaryKey: 'id',
    category: 'core',
    isMetadataSub: false,
  },
  {
    name: 'OwnedAsset',
    hasuraTable: toSnakeCase('OwnedAsset'),
    primaryKey: 'id',
    category: 'core',
    isMetadataSub: false,
  },
  {
    name: 'OwnedToken',
    hasuraTable: toSnakeCase('OwnedToken'),
    primaryKey: 'id',
    category: 'core',
    isMetadataSub: false,
  },

  // Event entities
  {
    name: 'Executed',
    hasuraTable: toSnakeCase('Executed'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'UniversalReceiver',
    hasuraTable: toSnakeCase('UniversalReceiver'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'Follow',
    hasuraTable: toSnakeCase('Follow'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'Follower',
    hasuraTable: toSnakeCase('Follower'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'Unfollow',
    hasuraTable: toSnakeCase('Unfollow'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'DataChanged',
    hasuraTable: toSnakeCase('DataChanged'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'TokenIdDataChanged',
    hasuraTable: toSnakeCase('TokenIdDataChanged'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'Transfer',
    hasuraTable: toSnakeCase('Transfer'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'DeployedContracts',
    hasuraTable: toSnakeCase('DeployedContracts'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'DeployedERC1167Proxies',
    hasuraTable: toSnakeCase('DeployedERC1167Proxies'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },
  {
    name: 'OwnershipTransferred',
    hasuraTable: toSnakeCase('OwnershipTransferred'),
    primaryKey: 'id',
    category: 'event',
    isMetadataSub: false,
  },

  // Ownership entities
  {
    name: 'UniversalProfileOwner',
    hasuraTable: toSnakeCase('UniversalProfileOwner'),
    primaryKey: 'id',
    category: 'ownership',
    isMetadataSub: false,
  },
  {
    name: 'DigitalAssetOwner',
    hasuraTable: toSnakeCase('DigitalAssetOwner'),
    primaryKey: 'id',
    category: 'ownership',
    isMetadataSub: false,
  },

  // LSP3 Profile metadata entities
  {
    name: 'LSP3Profile',
    hasuraTable: toSnakeCase('LSP3Profile'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: false,
  },
  {
    name: 'LSP3ProfileName',
    hasuraTable: toSnakeCase('LSP3ProfileName'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP3ProfileDescription',
    hasuraTable: toSnakeCase('LSP3ProfileDescription'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP3ProfileTag',
    hasuraTable: toSnakeCase('LSP3ProfileTag'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP3ProfileLink',
    hasuraTable: toSnakeCase('LSP3ProfileLink'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP3ProfileAsset',
    hasuraTable: toSnakeCase('LSP3ProfileAsset'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP3ProfileImage',
    hasuraTable: toSnakeCase('LSP3ProfileImage'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP3ProfileBackgroundImage',
    hasuraTable: toSnakeCase('LSP3ProfileBackgroundImage'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },

  // LSP4 Asset metadata entities
  {
    name: 'LSP4Metadata',
    hasuraTable: toSnakeCase('LSP4Metadata'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: false,
  },
  {
    name: 'LSP4MetadataName',
    hasuraTable: toSnakeCase('LSP4MetadataName'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataDescription',
    hasuraTable: toSnakeCase('LSP4MetadataDescription'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataScore',
    hasuraTable: toSnakeCase('LSP4MetadataScore'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataRank',
    hasuraTable: toSnakeCase('LSP4MetadataRank'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataCategory',
    hasuraTable: toSnakeCase('LSP4MetadataCategory'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataLink',
    hasuraTable: toSnakeCase('LSP4MetadataLink'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataIcon',
    hasuraTable: toSnakeCase('LSP4MetadataIcon'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataImage',
    hasuraTable: toSnakeCase('LSP4MetadataImage'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataAsset',
    hasuraTable: toSnakeCase('LSP4MetadataAsset'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP4MetadataAttribute',
    hasuraTable: toSnakeCase('LSP4MetadataAttribute'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },

  // LSP29 Encrypted Asset metadata entities
  {
    name: 'LSP29EncryptedAsset',
    hasuraTable: toSnakeCase('LSP29EncryptedAsset'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: false,
  },
  {
    name: 'LSP29EncryptedAssetTitle',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetTitle'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetDescription',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetDescription'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetFile',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetFile'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetEncryption',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetEncryption'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29AccessControlCondition',
    hasuraTable: toSnakeCase('LSP29AccessControlCondition'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetChunks',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetChunks'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetImage',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetImage'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetRevisionCount',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetRevisionCount'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetsLength',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetsLength'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },
  {
    name: 'LSP29EncryptedAssetEntry',
    hasuraTable: toSnakeCase('LSP29EncryptedAssetEntry'),
    primaryKey: 'id',
    category: 'metadata',
    isMetadataSub: true,
  },

  // LSP4 token properties
  {
    name: 'LSP4TokenName',
    hasuraTable: toSnakeCase('LSP4TokenName'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP4TokenSymbol',
    hasuraTable: toSnakeCase('LSP4TokenSymbol'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP4TokenType',
    hasuraTable: toSnakeCase('LSP4TokenType'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP4CreatorsLength',
    hasuraTable: toSnakeCase('LSP4CreatorsLength'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP4Creator',
    hasuraTable: toSnakeCase('LSP4Creator'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },

  // LSP5 received assets
  {
    name: 'LSP5ReceivedAssetsLength',
    hasuraTable: toSnakeCase('LSP5ReceivedAssetsLength'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP5ReceivedAsset',
    hasuraTable: toSnakeCase('LSP5ReceivedAsset'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },

  // LSP6 permissions/controllers
  {
    name: 'LSP6ControllersLength',
    hasuraTable: toSnakeCase('LSP6ControllersLength'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP6Controller',
    hasuraTable: toSnakeCase('LSP6Controller'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP6Permission',
    hasuraTable: toSnakeCase('LSP6Permission'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP6AllowedCall',
    hasuraTable: toSnakeCase('LSP6AllowedCall'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP6AllowedERC725YDataKey',
    hasuraTable: toSnakeCase('LSP6AllowedERC725YDataKey'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },

  // LSP8 token properties
  {
    name: 'LSP8TokenIdFormat',
    hasuraTable: toSnakeCase('LSP8TokenIdFormat'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP8ReferenceContract',
    hasuraTable: toSnakeCase('LSP8ReferenceContract'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP8TokenMetadataBaseURI',
    hasuraTable: toSnakeCase('LSP8TokenMetadataBaseURI'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },

  // LSP12 issued assets
  {
    name: 'LSP12IssuedAssetsLength',
    hasuraTable: toSnakeCase('LSP12IssuedAssetsLength'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },
  {
    name: 'LSP12IssuedAsset',
    hasuraTable: toSnakeCase('LSP12IssuedAsset'),
    primaryKey: 'id',
    category: 'lsp',
    isMetadataSub: false,
  },

  // Custom chillwhales/ORBS entities
  {
    name: 'ChillClaimed',
    hasuraTable: toSnakeCase('ChillClaimed'),
    primaryKey: 'id',
    category: 'custom',
    isMetadataSub: false,
  },
  {
    name: 'OrbsClaimed',
    hasuraTable: toSnakeCase('OrbsClaimed'),
    primaryKey: 'id',
    category: 'custom',
    isMetadataSub: false,
  },
  {
    name: 'OrbLevel',
    hasuraTable: toSnakeCase('OrbLevel'),
    primaryKey: 'id',
    category: 'custom',
    isMetadataSub: false,
  },
  {
    name: 'OrbCooldownExpiry',
    hasuraTable: toSnakeCase('OrbCooldownExpiry'),
    primaryKey: 'id',
    category: 'custom',
    isMetadataSub: false,
  },
  {
    name: 'OrbFaction',
    hasuraTable: toSnakeCase('OrbFaction'),
    primaryKey: 'id',
    category: 'custom',
    isMetadataSub: false,
  },
];

export const KNOWN_DIVERGENCES: KnownDivergence[] = [
  {
    entityType: 'OwnedAsset',
    field: 'owner',
    reason: 'V2 uses null FK instead of entity removal for invalid addresses',
  },
  {
    entityType: 'OwnedToken',
    field: 'owner',
    reason: 'V2 uses null FK instead of entity removal for invalid addresses',
  },
  {
    entityType: 'NFT',
    field: 'formattedTokenId',
    reason: 'V2 returns null for unknown LSP8 token ID formats (V1 returned raw tokenId)',
  },
];

/**
 * Get entity definition by name.
 */
export function getEntityByName(name: string): EntityDefinition | undefined {
  return ENTITY_REGISTRY.find((entity) => entity.name === name);
}

/**
 * Get known divergences for a specific entity type.
 */
export function getKnownDivergences(entityType: string): KnownDivergence[] {
  return KNOWN_DIVERGENCES.filter((d) => d.entityType === entityType);
}
