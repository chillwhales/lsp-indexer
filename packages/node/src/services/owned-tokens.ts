import type {
  OwnedToken,
  OwnedTokenFilter,
  OwnedTokenInclude,
  OwnedTokenResult,
  OwnedTokenSort,
  PartialOwnedToken,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  GetOwnedTokenDocument,
  GetOwnedTokensDocument,
  OwnedTokenSubscriptionDocument,
} from '../documents/owned-tokens';
import type {
  OwnedTokenSubscriptionSubscription,
  Owned_Token_Bool_Exp,
  Owned_Token_Order_By,
} from '../graphql/graphql';
import { parseOwnedToken, parseOwnedTokens } from '../parsers/owned-tokens';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildNftIncludeVars } from './nfts';
import { buildOwnedAssetIncludeVars } from './owned-assets';
import { buildProfileIncludeVars } from './profiles';
import { buildBlockOrderSort, escapeLike, hasActiveIncludes, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate OwnedTokenFilter to a Hasura _bool_exp. */
export function buildOwnedTokenWhere(filter?: OwnedTokenFilter): Owned_Token_Bool_Exp {
  if (!filter) return {};

  const conditions: Owned_Token_Bool_Exp[] = [];

  if (filter.holderAddress) {
    conditions.push({
      owner: { _ilike: `%${escapeLike(filter.holderAddress)}%` },
    });
  }

  if (filter.digitalAssetAddress) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.digitalAssetAddress)}%` },
    });
  }

  if (filter.tokenId) {
    conditions.push({
      token_id: { _ilike: `%${escapeLike(filter.tokenId)}%` },
    });
  }

  if (filter.holderName) {
    conditions.push({
      universalProfile: {
        lsp3Profile: { name: { value: { _ilike: `%${escapeLike(filter.holderName)}%` } } },
      },
    });
  }

  if (filter.assetName) {
    conditions.push({
      digitalAsset: {
        lsp4TokenName: { value: { _ilike: `%${escapeLike(filter.assetName)}%` } },
      },
    });
  }

  if (filter.tokenName) {
    const namePattern = `%${escapeLike(filter.tokenName)}%`;
    conditions.push({
      nft: {
        _or: [
          { lsp4Metadata: { name: { value: { _ilike: namePattern } } } },
          { lsp4MetadataBaseUri: { name: { value: { _ilike: namePattern } } } },
        ],
      },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate OwnedTokenSort to a Hasura order_by. */
function buildOwnedTokenOrderBy(sort?: OwnedTokenSort): Owned_Token_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
    case 'digitalAssetAddress':
      return [{ address: dir }, ...buildBlockOrderSort('desc')];
    case 'holderAddress':
      return [{ owner: dir }, ...buildBlockOrderSort('desc')];
    case 'tokenId':
      return [{ token_id: dir }, ...buildBlockOrderSort('desc')];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
function buildIncludeVars(include?: OwnedTokenInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const activeDA = hasActiveIncludes(include.digitalAsset);
  const activeNft = hasActiveIncludes(include.nft);
  const activeOA = hasActiveIncludes(include.ownedAsset);
  const activeHolder = hasActiveIncludes(include.holder);

  const vars: Record<string, boolean> = {
    includeBlockNumber: include.blockNumber ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeLogIndex: include.logIndex ?? false,
    includeDigitalAsset: activeDA,
    includeNft: activeNft,
    includeOwnedAsset: activeOA,
    includeProfile: activeHolder,
  };

  // Digital asset sub-includes: reuse DA include builder (keys already prefixed).
  if (activeDA) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    Object.assign(vars, daVars);
  }

  // NFT sub-includes: reuse NFT include builder with includeNft* prefix.
  if (activeNft) {
    const nftVars = buildNftIncludeVars(include.nft);
    Object.assign(vars, nftVars);
  }

  // Owned asset sub-includes: reuse owned asset include builder with includeOwnedAsset* prefix.
  if (activeOA) {
    const oaVars = buildOwnedAssetIncludeVars(include.ownedAsset);
    Object.assign(vars, oaVars);
  }

  // Profile sub-includes: reuse profile include builder with includeProfile* prefix.
  if (activeHolder) {
    const profileVars = buildProfileIncludeVars(include.holder);
    Object.assign(vars, profileVars);
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/** Fetch a single owned token by ID. */
export async function fetchOwnedToken(
  url: string,
  params: { id: string },
): Promise<OwnedToken | null>;
export async function fetchOwnedToken<const I extends OwnedTokenInclude>(
  url: string,
  params: { id: string; include: I },
): Promise<OwnedTokenResult<I> | null>;
export async function fetchOwnedToken(
  url: string,
  params: { id: string; include?: OwnedTokenInclude },
): Promise<PartialOwnedToken | null>;
export async function fetchOwnedToken(
  url: string,
  params: { id: string; include?: OwnedTokenInclude },
): Promise<PartialOwnedToken | null> {
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedTokenDocument, {
    where: { id: { _eq: params.id } },
    ...includeVars,
  });

  const raw = result.owned_token[0];
  if (!raw) return null;
  if (params.include) return parseOwnedToken(raw, params.include);
  return parseOwnedToken(raw);
}

export interface FetchOwnedTokensResult<P = OwnedToken> {
  ownedTokens: P[];
  totalCount: number;
}

/** Fetch a paginated list of owned tokens. */
export async function fetchOwnedTokens(
  url: string,
  params?: {
    filter?: OwnedTokenFilter;
    sort?: OwnedTokenSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchOwnedTokensResult>;
export async function fetchOwnedTokens<const I extends OwnedTokenInclude>(
  url: string,
  params: {
    filter?: OwnedTokenFilter;
    sort?: OwnedTokenSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchOwnedTokensResult<OwnedTokenResult<I>>>;
export async function fetchOwnedTokens(
  url: string,
  params: {
    filter?: OwnedTokenFilter;
    sort?: OwnedTokenSort;
    limit?: number;
    offset?: number;
    include?: OwnedTokenInclude;
  },
): Promise<FetchOwnedTokensResult<PartialOwnedToken>>;
export async function fetchOwnedTokens(
  url: string,
  params: {
    filter?: OwnedTokenFilter;
    sort?: OwnedTokenSort;
    limit?: number;
    offset?: number;
    include?: OwnedTokenInclude;
  } = {},
): Promise<FetchOwnedTokensResult<PartialOwnedToken>> {
  const where = buildOwnedTokenWhere(params.filter);
  const orderBy = buildOwnedTokenOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedTokensDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      ownedTokens: parseOwnedTokens(result.owned_token, params.include),
      totalCount: result.owned_token_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    ownedTokens: parseOwnedTokens(result.owned_token),
    totalCount: result.owned_token_aggregate?.aggregate?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

/** Raw subscription row type extracted from codegen. */
type RawOwnedTokenSubscriptionRow = OwnedTokenSubscriptionSubscription['owned_token'][number];

/** Build subscription config for useSubscription. */
export function buildOwnedTokenSubscriptionConfig(params: {
  filter?: OwnedTokenFilter;
  sort?: OwnedTokenSort;
  limit?: number;
  include?: OwnedTokenInclude;
}) {
  const where = buildOwnedTokenWhere(params.filter);
  const orderBy = buildOwnedTokenOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildIncludeVars(params.include);

  return {
    document: OwnedTokenSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: OwnedTokenSubscriptionSubscription) => result.owned_token,
    parser: (raw: RawOwnedTokenSubscriptionRow[]) =>
      params.include ? parseOwnedTokens(raw, params.include) : parseOwnedTokens(raw),
  };
}
