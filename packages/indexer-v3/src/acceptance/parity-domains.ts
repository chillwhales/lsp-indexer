type FieldKind =
  | 'address'
  | 'boolean'
  | 'compact-bytes'
  | 'hex'
  | 'integer'
  | 'string'
  | 'token-id-format'
  | 'token-type';

export interface ShadowParityField {
  name: string;
  source: string;
  target: string;
  kind: FieldKind;
}

export interface EndpointDomain {
  root: string;
  order: readonly string[];
  predicate?: string;
}

export interface ShadowParityDomain {
  name: string;
  source: EndpointDomain;
  target: EndpointDomain;
  fields: readonly ShadowParityField[];
}
function field(name: string, kind: FieldKind, source = name, target = name): ShadowParityField {
  return { name, source, target, kind };
}

export const SHADOW_PARITY_DOMAINS: readonly ShadowParityDomain[] = [
  {
    name: 'profiles',
    source: { root: 'universal_profile', order: ['address'] },
    target: { root: 'universal_profile', order: ['address'] },
    fields: [field('address', 'address')],
  },
  {
    name: 'profile-owners',
    source: { root: 'universal_profile_owner', order: ['id'] },
    target: {
      root: 'universal_profile',
      order: ['address'],
      predicate: 'owner_address: {_is_null: false}',
    },
    fields: [
      field('profileAddress', 'address', 'id', 'address'),
      field('ownerAddress', 'address', 'address', 'owner_address'),
    ],
  },
  {
    name: 'digital-assets',
    source: { root: 'digital_asset', order: ['address'] },
    target: { root: 'digital_asset', order: ['address'] },
    fields: [field('address', 'address')],
  },
  {
    name: 'digital-asset-owners',
    source: { root: 'digital_asset_owner', order: ['id'] },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'owner_address: {_is_null: false}',
    },
    fields: [
      field('assetAddress', 'address', 'id', 'address'),
      field('ownerAddress', 'address', 'address', 'owner_address'),
    ],
  },
  {
    name: 'nfts',
    source: { root: 'nft', order: ['address', 'token_id'] },
    target: { root: 'nft', order: ['address', 'token_id'] },
    fields: [
      field('address', 'address'),
      field('tokenId', 'hex', 'token_id', 'token_id'),
      field('formattedTokenId', 'string', 'formatted_token_id', 'formatted_token_id'),
      field('isMinted', 'boolean', 'is_minted', 'is_minted'),
      field('isBurned', 'boolean', 'is_burned', 'is_burned'),
    ],
  },
  {
    name: 'owned-assets',
    source: { root: 'owned_asset', order: ['owner', 'address'] },
    target: { root: 'owned_asset', order: ['owner_address', 'asset_address'] },
    fields: [
      field('ownerAddress', 'address', 'owner', 'owner_address'),
      field('assetAddress', 'address', 'address', 'asset_address'),
      field('balance', 'integer'),
    ],
  },
  {
    name: 'owned-tokens',
    source: { root: 'owned_token', order: ['owner', 'address', 'token_id'] },
    target: { root: 'owned_token', order: ['owner_address', 'asset_address', 'token_id'] },
    fields: [
      field('ownerAddress', 'address', 'owner', 'owner_address'),
      field('assetAddress', 'address', 'address', 'asset_address'),
      field('tokenId', 'hex', 'token_id', 'token_id'),
    ],
  },
  {
    name: 'followers',
    source: { root: 'follower', order: ['follower_address', 'followed_address'] },
    target: {
      root: 'follower',
      order: ['follower_address', 'followed_address'],
      predicate: 'is_following: {_eq: true}',
    },
    fields: [
      field('followerAddress', 'address', 'follower_address', 'follower_address'),
      field('followedAddress', 'address', 'followed_address', 'followed_address'),
    ],
  },
  {
    name: 'creators',
    source: { root: 'lsp4_creator', order: ['address', 'creator_address'] },
    target: { root: 'lsp4_creator', order: ['asset_address', 'creator_address'] },
    fields: [
      field('assetAddress', 'address', 'address', 'asset_address'),
      field('creatorAddress', 'address', 'creator_address', 'creator_address'),
      field('arrayIndex', 'integer', 'array_index', 'array_index'),
      field('interfaceId', 'hex', 'interface_id', 'interface_id'),
    ],
  },
  {
    name: 'issued-assets',
    source: { root: 'lsp12_issued_asset', order: ['address', 'asset_address'] },
    target: { root: 'lsp12_issued_asset', order: ['issuer_address', 'asset_address'] },
    fields: [
      field('issuerAddress', 'address', 'address', 'issuer_address'),
      field('assetAddress', 'address', 'asset_address', 'asset_address'),
      field('arrayIndex', 'integer', 'array_index', 'array_index'),
      field('interfaceId', 'hex', 'interface_id', 'interface_id'),
    ],
  },
  {
    name: 'controllers',
    source: { root: 'lsp6_controller', order: ['address', 'controller_address'] },
    target: { root: 'lsp6_controller', order: ['profile_address', 'controller_address'] },
    fields: [
      field('profileAddress', 'address', 'address', 'profile_address'),
      field('controllerAddress', 'address', 'controller_address', 'controller_address'),
      field('arrayIndex', 'integer', 'array_index', 'array_index'),
      field('permissions', 'hex', 'permissions_raw_value', 'permissions'),
      field('allowedCalls', 'compact-bytes', 'allowed_calls_raw_value', 'allowed_calls'),
      field('allowedDataKeys', 'compact-bytes', 'allowed_data_keys_raw_value', 'allowed_data_keys'),
    ],
  },
  {
    name: 'total-supply',
    source: { root: 'total_supply', order: ['address'] },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'total_supply: {_is_null: false}',
    },
    fields: [field('address', 'address'), field('value', 'integer', 'value', 'total_supply')],
  },
  {
    name: 'decimals',
    source: { root: 'decimals', order: ['address'] },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'decimals: {_is_null: false}',
    },
    fields: [field('address', 'address'), field('value', 'integer', 'value', 'decimals')],
  },
  {
    name: 'token-name',
    source: {
      root: 'lsp4_token_name',
      order: ['address'],
      predicate: 'value: {_is_null: false}',
    },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'name: {_is_null: false}',
    },
    fields: [field('address', 'address'), field('value', 'string', 'value', 'name')],
  },
  {
    name: 'token-symbol',
    source: {
      root: 'lsp4_token_symbol',
      order: ['address'],
      predicate: 'value: {_is_null: false}',
    },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'symbol: {_is_null: false}',
    },
    fields: [field('address', 'address'), field('value', 'string', 'value', 'symbol')],
  },
  {
    name: 'token-type',
    source: {
      root: 'lsp4_token_type',
      order: ['address'],
      predicate: 'value: {_is_null: false}',
    },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'token_type: {_is_null: false}',
    },
    fields: [field('address', 'address'), field('value', 'token-type', 'value', 'token_type')],
  },
  {
    name: 'token-id-format',
    source: {
      root: 'lsp8_token_id_format',
      order: ['address'],
      predicate: 'value: {_is_null: false}',
    },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'token_id_format: {_is_null: false}',
    },
    fields: [
      field('address', 'address'),
      field('value', 'token-id-format', 'value', 'token_id_format'),
    ],
  },
  {
    name: 'token-id-reference-contract',
    source: {
      root: 'lsp8_reference_contract',
      order: ['address'],
      predicate: 'value: {_regex: "^0x[0-9A-Fa-f]{40}$"}',
    },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'token_id_reference_contract: {_is_null: false}',
    },
    fields: [
      field('address', 'address'),
      field('value', 'address', 'value', 'token_id_reference_contract'),
    ],
  },
  {
    name: 'token-metadata-base-uri',
    source: {
      root: 'lsp8_token_metadata_base_uri',
      order: ['address'],
      predicate: 'value: {_is_null: false}',
    },
    target: {
      root: 'digital_asset',
      order: ['address'],
      predicate: 'base_uri: {_is_null: false}',
    },
    fields: [field('address', 'address'), field('value', 'string', 'value', 'base_uri')],
  },
];
