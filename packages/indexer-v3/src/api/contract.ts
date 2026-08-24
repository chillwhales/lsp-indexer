export const HASURA_SOURCE_NAME = 'v3';
export const HASURA_PUBLIC_ROLE = 'public';
export const HASURA_DATABASE_URL_VARIABLE = 'HASURA_GRAPHQL_V3_DATABASE_URL';

export type ApiTableName =
  | 'blocks'
  | 'event_facts'
  | 'universal_profiles'
  | 'digital_assets'
  | 'nfts'
  | 'owned_assets'
  | 'owned_tokens'
  | 'follower_edges'
  | 'creators'
  | 'issued_assets'
  | 'controllers'
  | 'chillwhales_nfts'
  | 'data_values'
  | 'metadata_revisions'
  | 'indexed_heads';

export interface ApiRelationshipContract {
  name: string;
  remoteTable: ApiTableName;
  columnMapping: Readonly<Record<string, string>>;
}

export interface ApiTableContract {
  table: ApiTableName;
  graphqlName: string;
  paginationOrder: readonly string[];
  objectRelationships: readonly ApiRelationshipContract[];
  arrayRelationships: readonly ApiRelationshipContract[];
}

function relationship(
  name: string,
  remoteTable: ApiTableName,
  columnMapping: Readonly<Record<string, string>>,
): ApiRelationshipContract {
  return { name, remoteTable, columnMapping };
}

const byAddress = { chain_id: 'chain_id', address: 'address' };
const byAssetAddress = { chain_id: 'chain_id', address: 'asset_address' };
const byOwnerAddress = { chain_id: 'chain_id', address: 'owner_address' };
const byOwnership = {
  chain_id: 'chain_id',
  owner_address: 'owner_address',
  asset_address: 'asset_address',
};
const byToken = { chain_id: 'chain_id', address: 'address', token_id: 'token_id' };
const byChainAndId = ['chain_id', 'id'] as const;

/** Stable Hasura names and chain-scoped relationships consumed by every v3 package. */
export const API_TABLE_CONTRACTS: readonly ApiTableContract[] = [
  {
    table: 'blocks',
    graphqlName: 'block',
    paginationOrder: byChainAndId,
    objectRelationships: [],
    arrayRelationships: [
      relationship('events', 'event_facts', {
        chain_id: 'chain_id',
        number: 'block_number',
      }),
    ],
  },
  {
    table: 'event_facts',
    graphqlName: 'event_fact',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('block', 'blocks', { chain_id: 'chain_id', block_number: 'number' }),
      relationship('universalProfile', 'universal_profiles', byAddress),
      relationship('digitalAsset', 'digital_assets', byAddress),
    ],
    arrayRelationships: [],
  },
  {
    table: 'universal_profiles',
    graphqlName: 'universal_profile',
    paginationOrder: byChainAndId,
    objectRelationships: [],
    arrayRelationships: [
      relationship('ownedAssets', 'owned_assets', byOwnerAddress),
      relationship('ownedTokens', 'owned_tokens', byOwnerAddress),
      relationship('controllers', 'controllers', {
        chain_id: 'chain_id',
        address: 'profile_address',
      }),
      relationship('issuedAssets', 'issued_assets', {
        chain_id: 'chain_id',
        address: 'issuer_address',
      }),
      relationship('followed', 'follower_edges', {
        chain_id: 'chain_id',
        address: 'follower_address',
      }),
      relationship('followedBy', 'follower_edges', {
        chain_id: 'chain_id',
        address: 'followed_address',
      }),
      relationship('dataValues', 'data_values', byAddress),
      relationship('metadataRevisions', 'metadata_revisions', byAddress),
    ],
  },
  {
    table: 'digital_assets',
    graphqlName: 'digital_asset',
    paginationOrder: byChainAndId,
    objectRelationships: [],
    arrayRelationships: [
      relationship('nfts', 'nfts', byAddress),
      relationship('ownedAssets', 'owned_assets', byAssetAddress),
      relationship('ownedTokens', 'owned_tokens', byAssetAddress),
      relationship('lsp4Creators', 'creators', byAssetAddress),
      relationship('lsp12IssuedBy', 'issued_assets', byAssetAddress),
      relationship('dataValues', 'data_values', byAddress),
      relationship('metadataRevisions', 'metadata_revisions', byAddress),
    ],
  },
  {
    table: 'nfts',
    graphqlName: 'nft',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('digitalAsset', 'digital_assets', byAddress),
      relationship('chillwhales', 'chillwhales_nfts', byToken),
      relationship('ownedToken', 'owned_tokens', {
        chain_id: 'chain_id',
        address: 'asset_address',
        token_id: 'token_id',
        owner_address: 'owner_address',
      }),
    ],
    arrayRelationships: [
      relationship('ownedTokens', 'owned_tokens', {
        chain_id: 'chain_id',
        address: 'asset_address',
        token_id: 'token_id',
      }),
      relationship('dataValues', 'data_values', byToken),
      relationship('metadataRevisions', 'metadata_revisions', byToken),
    ],
  },
  {
    table: 'owned_assets',
    graphqlName: 'owned_asset',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('universalProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        owner_address: 'address',
      }),
      relationship('digitalAsset', 'digital_assets', {
        chain_id: 'chain_id',
        asset_address: 'address',
      }),
    ],
    arrayRelationships: [relationship('tokenIds', 'owned_tokens', byOwnership)],
  },
  {
    table: 'owned_tokens',
    graphqlName: 'owned_token',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('universalProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        owner_address: 'address',
      }),
      relationship('digitalAsset', 'digital_assets', {
        chain_id: 'chain_id',
        asset_address: 'address',
      }),
      relationship('nft', 'nfts', {
        chain_id: 'chain_id',
        asset_address: 'address',
        token_id: 'token_id',
      }),
      relationship('ownedAsset', 'owned_assets', byOwnership),
    ],
    arrayRelationships: [],
  },
  {
    table: 'follower_edges',
    graphqlName: 'follower',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('followerUniversalProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        follower_address: 'address',
      }),
      relationship('followedUniversalProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        followed_address: 'address',
      }),
    ],
    arrayRelationships: [],
  },
  {
    table: 'creators',
    graphqlName: 'lsp4_creator',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('digitalAsset', 'digital_assets', {
        chain_id: 'chain_id',
        asset_address: 'address',
      }),
      relationship('creatorProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        creator_address: 'address',
      }),
    ],
    arrayRelationships: [],
  },
  {
    table: 'issued_assets',
    graphqlName: 'lsp12_issued_asset',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('universalProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        issuer_address: 'address',
      }),
      relationship('digitalAsset', 'digital_assets', {
        chain_id: 'chain_id',
        asset_address: 'address',
      }),
    ],
    arrayRelationships: [],
  },
  {
    table: 'controllers',
    graphqlName: 'lsp6_controller',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('universalProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        profile_address: 'address',
      }),
      relationship('controllerProfile', 'universal_profiles', {
        chain_id: 'chain_id',
        controller_address: 'address',
      }),
    ],
    arrayRelationships: [],
  },
  {
    table: 'chillwhales_nfts',
    graphqlName: 'chillwhales_nft',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('nft', 'nfts', byToken),
      relationship('digitalAsset', 'digital_assets', byAddress),
    ],
    arrayRelationships: [],
  },
  {
    table: 'data_values',
    graphqlName: 'data_value',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('universalProfile', 'universal_profiles', byAddress),
      relationship('digitalAsset', 'digital_assets', byAddress),
      relationship('nft', 'nfts', byToken),
    ],
    arrayRelationships: [],
  },
  {
    table: 'metadata_revisions',
    graphqlName: 'metadata_revision',
    paginationOrder: byChainAndId,
    objectRelationships: [
      relationship('universalProfile', 'universal_profiles', byAddress),
      relationship('digitalAsset', 'digital_assets', byAddress),
      relationship('nft', 'nfts', byToken),
    ],
    arrayRelationships: [],
  },
  {
    table: 'indexed_heads',
    graphqlName: 'indexed_head',
    paginationOrder: ['chain_id', 'network'],
    objectRelationships: [],
    arrayRelationships: [],
  },
];
