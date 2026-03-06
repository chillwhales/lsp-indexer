import type {
  DigitalAsset,
  DigitalAssetFilter,
  DigitalAssetInclude,
  DigitalAssetResult,
  DigitalAssetSort,
  PartialDigitalAsset,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  DigitalAssetSubscriptionDocument,
  GetDigitalAssetDocument,
  GetDigitalAssetsDocument,
} from '../documents/digital-assets';
import type {
  DigitalAssetSubscriptionSubscription,
  Digital_Asset_Bool_Exp,
  Digital_Asset_Order_By,
} from '../graphql/graphql';
import { parseDigitalAsset, parseDigitalAssets } from '../parsers/digital-assets';
import { escapeLike, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate DigitalAssetFilter to a Hasura _bool_exp. */
export function buildDigitalAssetWhere(filter?: DigitalAssetFilter): Digital_Asset_Bool_Exp {
  if (!filter) return {};

  const conditions: Digital_Asset_Bool_Exp[] = [];

  if (filter.name) {
    conditions.push({
      lsp4TokenName: {
        value: { _ilike: `%${escapeLike(filter.name)}%` },
      },
    });
  }

  if (filter.symbol) {
    conditions.push({
      lsp4TokenSymbol: {
        value: { _ilike: `%${escapeLike(filter.symbol)}%` },
      },
    });
  }

  if (filter.tokenType) {
    conditions.push({
      lsp4TokenType: {
        value: { _eq: filter.tokenType },
      },
    });
  }

  if (filter.category) {
    conditions.push({
      lsp4Metadata: {
        category: { value: { _ilike: `%${escapeLike(filter.category)}%` } },
      },
    });
  }

  if (filter.holderAddress) {
    // "Assets that address X holds tokens of"
    // holderAddress is in owned_asset.owner (the holder's address)
    conditions.push({
      ownedAssets: {
        owner: { _ilike: escapeLike(filter.holderAddress) },
      },
    });
  }

  if (filter.ownerAddress) {
    // "Assets whose contract controller is address X"
    // ownerAddress is the digital_asset.owner.address (contract controller)
    conditions.push({
      owner: {
        address: { _ilike: escapeLike(filter.ownerAddress) },
      },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/** Translate DigitalAssetSort to a Hasura order_by. */
export function buildDigitalAssetOrderBy(
  sort?: DigitalAssetSort,
): Digital_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'name':
      return [{ lsp4TokenName: { value: dir } }];
    case 'symbol':
      return [{ lsp4TokenSymbol: { value: dir } }];
    case 'holderCount':
      return [{ ownedAssets_aggregate: { count: dir } }];
    case 'creatorCount':
      return [{ lsp4CreatorsLength: { value: dir } }];
    case 'totalSupply':
      return [{ totalSupply: { value: dir } }];
    case 'createdAt':
      return [{ owner: { timestamp: dir } }];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
export function buildDigitalAssetIncludeVars(
  include?: boolean | DigitalAssetInclude,
): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }
  // true = include everything → return empty (GraphQL defaults all to true)
  if (include === true) {
    return {};
  }

  return {
    includeName: include.name ?? false,
    includeSymbol: include.symbol ?? false,
    includeTokenType: include.tokenType ?? false,
    includeDecimals: include.decimals ?? false,
    includeTotalSupply: include.totalSupply ?? false,
    includeDescription: include.description ?? false,
    includeCategory: include.category ?? false,
    includeIcons: include.icons ?? false,
    includeImages: include.images ?? false,
    includeLinks: include.links ?? false,
    includeAttributes: include.attributes ?? false,
    includeOwner: include.owner ?? false,
    includeHolderCount: include.holderCount ?? false,
    includeCreatorCount: include.creatorCount ?? false,
    includeReferenceContract: include.referenceContract ?? false,
    includeTokenIdFormat: include.tokenIdFormat ?? false,
    includeBaseUri: include.baseUri ?? false,
  };
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

type RawDigitalAssetSubscriptionRow = DigitalAssetSubscriptionSubscription['digital_asset'][number];

/**
 * Build a digital asset subscription config (document, variables, extract, parser).
 *
 * Encapsulates the domain-specific assembly that `createUseDigitalAssetSubscription`
 * needs — mirroring how `fetchDigitalAssets` encapsulates query assembly. Keeps the
 * React hook factory focused on hook lifecycle rather than domain plumbing.
 *
 * The return type is inferred so the 4-generic chain
 * `SubscriptionConfig<TResult, TVariables, TRaw, TParsed>` flows through
 * `useSubscription` without any casts or `unknown` holes.
 *
 */
export function buildDigitalAssetSubscriptionConfig(params: {
  filter?: DigitalAssetFilter;
  sort?: DigitalAssetSort;
  limit?: number;
  include?: DigitalAssetInclude;
}) {
  const where = buildDigitalAssetWhere(params.filter);
  const orderBy = buildDigitalAssetOrderBy(params.sort);
  const includeVars = buildDigitalAssetIncludeVars(params.include);

  return {
    document: DigitalAssetSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: DigitalAssetSubscriptionSubscription) => result.digital_asset,
    parser: (raw: RawDigitalAssetSubscriptionRow[]) =>
      params.include ? parseDigitalAssets(raw, params.include) : parseDigitalAssets(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single digital asset by address.
 *
 * Translates the address to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `DigitalAsset`, or `null` if
 * the address doesn't exist.
 *
 * When `include` is provided, the return type is narrowed to only contain
 * base fields + included fields (e.g., `DigitalAssetResult<{ name: true }>` =
 * `{ address: string; name: string | null }`).
 *
 */
export async function fetchDigitalAsset(
  url: string,
  params: { address: string },
): Promise<DigitalAsset | null>;
export async function fetchDigitalAsset<const I extends DigitalAssetInclude>(
  url: string,
  params: { address: string; include: I },
): Promise<DigitalAssetResult<I> | null>;
export async function fetchDigitalAsset(
  url: string,
  params: { address: string; include?: DigitalAssetInclude },
): Promise<PartialDigitalAsset | null>;
export async function fetchDigitalAsset(
  url: string,
  params: { address: string; include?: DigitalAssetInclude },
): Promise<PartialDigitalAsset | null> {
  const includeVars = buildDigitalAssetIncludeVars(params.include);

  const result = await execute(url, GetDigitalAssetDocument, {
    where: { address: { _ilike: escapeLike(params.address) } },
    ...includeVars,
  });

  const raw = result.digital_asset[0];
  if (!raw) return null;
  if (params.include) return parseDigitalAsset(raw, params.include);
  return parseDigitalAsset(raw);
}

export interface FetchDigitalAssetsResult<P = DigitalAsset> {
  /** Parsed digital assets for the current page (narrowed by include) */
  digitalAssets: P[];
  /** Total number of digital assets matching the filter (for pagination UI) */
  totalCount: number;
}

/** Fetch a paginated list of digital assets. */
export async function fetchDigitalAssets(
  url: string,
  params?: {
    filter?: DigitalAssetFilter;
    sort?: DigitalAssetSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchDigitalAssetsResult>;
export async function fetchDigitalAssets<const I extends DigitalAssetInclude>(
  url: string,
  params: {
    filter?: DigitalAssetFilter;
    sort?: DigitalAssetSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchDigitalAssetsResult<DigitalAssetResult<I>>>;
export async function fetchDigitalAssets(
  url: string,
  params: {
    filter?: DigitalAssetFilter;
    sort?: DigitalAssetSort;
    limit?: number;
    offset?: number;
    include?: DigitalAssetInclude;
  },
): Promise<FetchDigitalAssetsResult<PartialDigitalAsset>>;
export async function fetchDigitalAssets(
  url: string,
  params: {
    filter?: DigitalAssetFilter;
    sort?: DigitalAssetSort;
    limit?: number;
    offset?: number;
    include?: DigitalAssetInclude;
  } = {},
): Promise<FetchDigitalAssetsResult<PartialDigitalAsset>> {
  const where = buildDigitalAssetWhere(params.filter);
  const orderBy = buildDigitalAssetOrderBy(params.sort);
  const includeVars = buildDigitalAssetIncludeVars(params.include);

  const result = await execute(url, GetDigitalAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      digitalAssets: parseDigitalAssets(result.digital_asset, params.include),
      totalCount: result.digital_asset_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    digitalAssets: parseDigitalAssets(result.digital_asset),
    totalCount: result.digital_asset_aggregate?.aggregate?.count ?? 0,
  };
}
