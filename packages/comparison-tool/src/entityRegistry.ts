import { ComparisonMode, EntityDefinition, KnownDivergence } from './types';

/**
 * Convert PascalCase entity name to snake_case Hasura table name.
 * Handles consecutive capitals correctly: LSP3ProfileImage → lsp3_profile_image
 */
function toSnakeCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function entity(
  name: string,
  category: EntityDefinition['category'],
  isMetadataSub: boolean = false,
): EntityDefinition {
  return {
    name,
    hasuraTable: toSnakeCase(name),
    primaryKey: 'id',
    category,
    isMetadataSub,
  };
}

export const ENTITY_REGISTRY: EntityDefinition[] = [
  // Core entities
  entity('UniversalProfile', 'core'),
  entity('DigitalAsset', 'core'),
  entity('TotalSupply', 'core'),
  entity('Decimals', 'core'),
  entity('NFT', 'core'),
  entity('OwnedAsset', 'core'),
  entity('OwnedToken', 'core'),

  // Event entities
  entity('Executed', 'event'),
  entity('UniversalReceiver', 'event'),
  entity('Follow', 'event'),
  entity('Follower', 'event'),
  entity('Unfollow', 'event'),
  entity('DataChanged', 'event'),
  entity('TokenIdDataChanged', 'event'),
  entity('Transfer', 'event'),
  entity('DeployedContracts', 'event'),
  entity('DeployedERC1167Proxies', 'event'),
  entity('OwnershipTransferred', 'event'),

  // Ownership entities
  entity('UniversalProfileOwner', 'ownership'),
  entity('DigitalAssetOwner', 'ownership'),

  // LSP3 Profile metadata
  entity('LSP3Profile', 'metadata'),
  entity('LSP3ProfileName', 'metadata', true),
  entity('LSP3ProfileDescription', 'metadata', true),
  entity('LSP3ProfileTag', 'metadata', true),
  entity('LSP3ProfileLink', 'metadata', true),
  entity('LSP3ProfileAsset', 'metadata', true),
  entity('LSP3ProfileImage', 'metadata', true),
  entity('LSP3ProfileBackgroundImage', 'metadata', true),

  // LSP4 Asset metadata
  entity('LSP4Metadata', 'metadata'),
  entity('LSP4MetadataName', 'metadata', true),
  entity('LSP4MetadataDescription', 'metadata', true),
  entity('LSP4MetadataScore', 'metadata', true),
  entity('LSP4MetadataRank', 'metadata', true),
  entity('LSP4MetadataCategory', 'metadata', true),
  entity('LSP4MetadataLink', 'metadata', true),
  entity('LSP4MetadataIcon', 'metadata', true),
  entity('LSP4MetadataImage', 'metadata', true),
  entity('LSP4MetadataAsset', 'metadata', true),
  entity('LSP4MetadataAttribute', 'metadata', true),

  // LSP29 Encrypted Asset metadata
  entity('LSP29EncryptedAsset', 'metadata'),
  entity('LSP29EncryptedAssetTitle', 'metadata', true),
  entity('LSP29EncryptedAssetDescription', 'metadata', true),
  entity('LSP29EncryptedAssetFile', 'metadata', true),
  entity('LSP29EncryptedAssetEncryption', 'metadata', true),
  entity('LSP29AccessControlCondition', 'metadata', true),
  entity('LSP29EncryptedAssetChunks', 'metadata', true),
  entity('LSP29EncryptedAssetImage', 'metadata', true),
  entity('LSP29EncryptedAssetRevisionCount', 'metadata', true),
  entity('LSP29EncryptedAssetsLength', 'metadata', true),
  entity('LSP29EncryptedAssetEntry', 'metadata', true),

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
  {
    entityType: 'LSP8ReferenceContract',
    field: 'count',
    reason:
      'V1 switch fall-through bug creates phantom entities from unrelated DataChanged events (LSP4Creators[].length, LSP5ReceivedAssets[].length, AddressPermissions[].length fall through to LSP8ReferenceContract case)',
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
