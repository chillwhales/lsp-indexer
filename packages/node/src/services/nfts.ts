import type {
  Nft,
  NftFilter,
  NftInclude,
  NftResult,
  NftSort,
  OwnedTokenNftInclude,
  PartialNft,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetNftDocument, GetNftsDocument, NftSubscriptionDocument } from '../documents/nfts';
import type { NftSubscriptionSubscription, Nft_Bool_Exp, Nft_Order_By } from '../graphql/graphql';
import { parseNft, parseNfts } from '../parsers/nfts';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { buildBlockOrderSort, escapeLike, hasActiveIncludes, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate NftFilter to a Hasura _bool_exp. */
export function buildNftWhere(filter?: NftFilter): Nft_Bool_Exp {
  if (!filter) return {};

  const conditions: Nft_Bool_Exp[] = [];

  if (filter.collectionAddress) {
    conditions.push({
      address: { _ilike: escapeLike(filter.collectionAddress) },
    });
  }

  if (filter.tokenId) {
    conditions.push({
      token_id: { _ilike: escapeLike(filter.tokenId) },
    });
  }

  if (filter.formattedTokenId) {
    conditions.push({
      formatted_token_id: { _ilike: escapeLike(filter.formattedTokenId) },
    });
  }

  if (filter.name) {
    const namePattern = `%${escapeLike(filter.name)}%`;
    conditions.push({
      _or: [
        { lsp4Metadata: { name: { value: { _ilike: namePattern } } } },
        { lsp4MetadataBaseUri: { name: { value: { _ilike: namePattern } } } },
      ],
    });
  }

  if (filter.holderAddress) {
    conditions.push({
      ownedToken: {
        owner: { _ilike: escapeLike(filter.holderAddress) },
      },
    });
  }

  if (filter.isBurned !== undefined) {
    conditions.push({
      is_burned: { _eq: filter.isBurned },
    });
  }

  if (filter.isMinted !== undefined) {
    conditions.push({
      is_minted: { _eq: filter.isMinted },
    });
  }

  if (filter.chillClaimed !== undefined) {
    conditions.push({
      chillClaimed: { value: { _eq: filter.chillClaimed } },
    });
  }

  if (filter.orbsClaimed !== undefined) {
    conditions.push({
      orbsClaimed: { value: { _eq: filter.orbsClaimed } },
    });
  }

  if (filter.maxLevel !== undefined) {
    conditions.push({
      level: { value: { _lte: filter.maxLevel } },
    });
  }

  if (filter.cooldownExpiryBefore !== undefined) {
    conditions.push({
      cooldownExpiry: { value: { _lte: filter.cooldownExpiryBefore } },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate NftSort to a Hasura order_by. */
export function buildNftOrderBy(sort?: NftSort): Nft_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
    case 'tokenId':
      return [{ token_id: orderDir(sort.direction, sort.nulls) }, ...buildBlockOrderSort('desc')];
    case 'formattedTokenId':
      return [
        { formatted_token_id: orderDir(sort.direction, sort.nulls ?? 'last') },
        ...buildBlockOrderSort('desc'),
      ];
    case 'score':
      return [
        { lsp4Metadata: { score: { value: orderDir(sort.direction, sort.nulls) } } },
        ...buildBlockOrderSort('desc'),
      ];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
function buildIncludeVars(include?: NftInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const activeCollection = hasActiveIncludes(include.collection);
  const activeHolder = hasActiveIncludes(include.holder);

  const vars: Record<string, boolean> = {
    includeFormattedTokenId: include.formattedTokenId ?? false,
    includeName: include.name ?? false,
    includeCollection: activeCollection,
    includeHolder: activeHolder,
    includeDescription: include.description ?? false,
    includeCategory: include.category ?? false,
    includeIcons: include.icons ?? false,
    includeImages: include.images ?? false,
    includeLinks: include.links ?? false,
    includeAttributes: include.attributes ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeBlockNumber: include.blockNumber ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeLogIndex: include.logIndex ?? false,
    includeScore: include.score ?? false,
    includeRank: include.rank ?? false,
    includeChillClaimed: include.chillClaimed ?? false,
    includeOrbsClaimed: include.orbsClaimed ?? false,
    includeLevel: include.level ?? false,
    includeCooldownExpiry: include.cooldownExpiry ?? false,
    includeFaction: include.faction ?? false,
  };

  // Collection sub-includes: reuse DA include builder, remap includeDigitalAsset* → includeCollection*.
  if (activeCollection) {
    const daVars = buildDigitalAssetIncludeVars(include.collection);
    for (const [key, val] of Object.entries(daVars)) {
      vars[key.replace('includeDigitalAsset', 'includeCollection')] = val;
    }
  }

  // Holder sub-includes: reuse profile include builder with "Holder" prefix.
  if (activeHolder) {
    const profileVars = buildProfileIncludeVars(include.holder);
    for (const [key, val] of Object.entries(profileVars)) {
      // includeProfileX → includeHolderX
      vars[key.replace('includeProfile', 'includeHolder')] = val;
    }
  }

  return vars;
}

/** Build NFT sub-include variables for owned-token nested relations (includeNft* prefix). */
export function buildNftIncludeVars(
  include?: boolean | OwnedTokenNftInclude,
): Record<string, boolean> {
  if (!include) {
    return {};
  }
  // true = include everything → return empty (GraphQL defaults all to true)
  if (include === true) {
    return {};
  }

  return {
    includeNftFormattedTokenId: include.formattedTokenId ?? false,
    includeNftName: include.name ?? false,
    includeNftDescription: include.description ?? false,
    includeNftCategory: include.category ?? false,
    includeNftIcons: include.icons ?? false,
    includeNftImages: include.images ?? false,
    includeNftLinks: include.links ?? false,
    includeNftAttributes: include.attributes ?? false,
    includeNftTimestamp: include.timestamp ?? false,
    includeNftBlockNumber: include.blockNumber ?? false,
    includeNftTransactionIndex: include.transactionIndex ?? false,
    includeNftLogIndex: include.logIndex ?? false,
    includeNftScore: include.score ?? false,
    includeNftRank: include.rank ?? false,
    includeNftChillClaimed: include.chillClaimed ?? false,
    includeNftOrbsClaimed: include.orbsClaimed ?? false,
    includeNftLevel: include.level ?? false,
    includeNftCooldownExpiry: include.cooldownExpiry ?? false,
    includeNftFaction: include.faction ?? false,
  };
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

type RawNftSubscriptionRow = NftSubscriptionSubscription['nft'][number];

/** Build subscription config for useSubscription. */
export function buildNftSubscriptionConfig(params: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  include?: NftInclude;
}) {
  const where = buildNftWhere(params.filter);
  const orderBy = buildNftOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIncludeVars(params.include);

  return {
    document: NftSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: NftSubscriptionSubscription) => result.nft,
    parser: (raw: RawNftSubscriptionRow[]) =>
      params.include ? parseNfts(raw, params.include) : parseNfts(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/** Fetch a single NFT by collection address and token ID. */
export async function fetchNft(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string },
): Promise<Nft | null>;
export async function fetchNft<const I extends NftInclude>(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string; include: I },
): Promise<NftResult<I> | null>;
export async function fetchNft(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string; include?: NftInclude },
): Promise<PartialNft | null>;
export async function fetchNft(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string; include?: NftInclude },
): Promise<PartialNft | null> {
  if (!params.tokenId && !params.formattedTokenId) {
    throw new Error('fetchNft requires at least one of tokenId or formattedTokenId');
  }

  const includeVars = buildIncludeVars(params.include);

  const conditions: Nft_Bool_Exp[] = [{ address: { _ilike: escapeLike(params.address) } }];

  if (params.tokenId) {
    conditions.push({ token_id: { _ilike: escapeLike(params.tokenId) } });
  }

  if (params.formattedTokenId) {
    conditions.push({
      formatted_token_id: { _ilike: escapeLike(params.formattedTokenId) },
    });
  }

  const result = await execute(url, GetNftDocument, {
    where: conditions.length === 1 ? conditions[0] : { _and: conditions },
    ...includeVars,
  });

  const raw = result.nft[0];
  if (!raw) return null;
  if (params.include) return parseNft(raw, params.include);
  return parseNft(raw);
}

export interface FetchNftsResult<P = Nft> {
  nfts: P[];
  totalCount: number;
}

/** Fetch a paginated list of NFTs. */
export async function fetchNfts(
  url: string,
  params?: { filter?: NftFilter; sort?: NftSort; limit?: number; offset?: number },
): Promise<FetchNftsResult>;
export async function fetchNfts<const I extends NftInclude>(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchNftsResult<NftResult<I>>>;
export async function fetchNfts(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
    include?: NftInclude;
  },
): Promise<FetchNftsResult<PartialNft>>;
export async function fetchNfts(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
    include?: NftInclude;
  } = {},
): Promise<FetchNftsResult<PartialNft>> {
  const where = buildNftWhere(params.filter);
  const orderBy = buildNftOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetNftsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      nfts: parseNfts(result.nft, params.include),
      totalCount: result.nft_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    nfts: parseNfts(result.nft),
    totalCount: result.nft_aggregate?.aggregate?.count ?? 0,
  };
}
