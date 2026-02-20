import type {
  DigitalAsset,
  DigitalAssetFilter,
  DigitalAssetInclude,
  DigitalAssetSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetDigitalAssetDocument, GetDigitalAssetsDocument } from '../documents/digital-assets';
import type { Digital_Asset_Bool_Exp, Digital_Asset_Order_By } from '../graphql/graphql';
import { parseDigitalAsset, parseDigitalAssets } from '../parsers/digital-assets';
import { escapeLike, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `DigitalAssetFilter` to a Hasura `digital_asset_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `name`          → `{ lsp4TokenName: { value: { _ilike: '%name%' } } }`
 * - `symbol`        → `{ lsp4TokenSymbol: { value: { _ilike: '%symbol%' } } }`
 * - `tokenType`     → `{ lsp4TokenType: { value: { _eq: tokenType } } }`
 *                     the indexer stores the decoded string directly ("TOKEN", "NFT", "COLLECTION")
 * - `category`      → `{ lsp4Metadata: { category: { value: { _ilike: '%category%' } } } }`
 * - `holderAddress` → `{ ownedAssets: { owner: { _ilike: escapeLike(holderAddress) } } }`
 *                     (assets where the given address holds tokens — via owned_asset.owner)
 * - `ownerAddress`  → `{ owner: { address: { _ilike: escapeLike(ownerAddress) } } }`
 *                     (assets whose contract controller is the given address)
 */
function buildDigitalAssetWhere(filter?: DigitalAssetFilter): Digital_Asset_Bool_Exp {
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

/**
 * Translate a flat `DigitalAssetSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'name'`         → `[{ lsp4TokenName: { value: dir } }]`
 * - `'symbol'`       → `[{ lsp4TokenSymbol: { value: dir } }]`
 * - `'holderCount'`  → `[{ ownedAssets_aggregate: { count: dir } }]`
 * - `'creatorCount'` → `[{ lsp4CreatorsLength: { value: dir } }]`
 * - `'totalSupply'`  → `[{ totalSupply: { value: dir } }]`
 * - `'createdAt'`    → `[{ owner: { timestamp: dir } }]` (LOCKED DECISION)
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildDigitalAssetOrderBy(sort?: DigitalAssetSort): Digital_Asset_Order_By[] | undefined {
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

/**
 * Translate a `DigitalAssetInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 */
export function buildDigitalAssetIncludeVars(
  include?: DigitalAssetInclude,
): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
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
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single digital asset by address.
 *
 * Translates the address to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `DigitalAsset`, or `null` if
 * the address doesn't exist.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address + optional include)
 * @returns The parsed digital asset, or `null` if not found
 */
export async function fetchDigitalAsset(
  url: string,
  params: { address: string; include?: DigitalAssetInclude },
): Promise<DigitalAsset | null> {
  const includeVars = buildDigitalAssetIncludeVars(params.include);

  const result = await execute(url, GetDigitalAssetDocument, {
    where: { address: { _ilike: escapeLike(params.address) } },
    ...includeVars,
  });

  const raw = result.digital_asset[0];
  return raw ? parseDigitalAsset(raw) : null;
}

/**
 * Result shape for paginated digital asset list queries.
 */
export interface FetchDigitalAssetsResult {
  /** Parsed digital assets for the current page */
  digitalAssets: DigitalAsset[];
  /** Total number of digital assets matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of digital assets with filtering, sorting, and total count.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed digital assets and total count
 */
export async function fetchDigitalAssets(
  url: string,
  params: {
    filter?: DigitalAssetFilter;
    sort?: DigitalAssetSort;
    limit?: number;
    offset?: number;
    include?: DigitalAssetInclude;
  } = {},
): Promise<FetchDigitalAssetsResult> {
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

  return {
    digitalAssets: parseDigitalAssets(result.digital_asset),
    totalCount: result.digital_asset_aggregate?.aggregate?.count ?? 0,
  };
}
