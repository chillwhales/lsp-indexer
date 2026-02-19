import type { DigitalAsset, DigitalAssetFilter, DigitalAssetSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetDigitalAssetDocument, GetDigitalAssetsDocument } from '../documents/digital-assets';
import type { Digital_Asset_Bool_Exp, Digital_Asset_Order_By } from '../graphql/graphql';
import { parseDigitalAsset, parseDigitalAssets } from '../parsers/digital-assets';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Escape SQL LIKE wildcards (`%` and `_`) in a string so they are treated
 * as literal characters when used with Hasura's `_ilike` operator.
 */
function escapeLike(value: string): string {
  return value.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

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
 * - `name`           → `{ lsp4TokenName: { value: { _ilike: '%name%' } } }`
 * - `symbol`         → `{ lsp4TokenSymbol: { value: { _ilike: '%symbol%' } } }`
 * - `tokenType`      → `{ lsp4TokenType: { value: { _eq: tokenType } } }`
 * - `creatorAddress`  → `{ lsp4Creators: { creator_address: { _ilike: address } } }`
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

  if (filter.creatorAddress) {
    conditions.push({
      lsp4Creators: {
        creator_address: { _ilike: filter.creatorAddress },
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
 * - `'name'`         → `[{ lsp4TokenName: { value: direction } }]`
 * - `'symbol'`       → `[{ lsp4TokenSymbol: { value: direction } }]`
 * - `'holderCount'`  → `[{ ownedTokens_aggregate: { count: direction } }]`
 * - `'creatorCount'` → `[{ lsp4Creators_aggregate: { count: direction } }]`
 */
function buildDigitalAssetOrderBy(sort?: DigitalAssetSort): Digital_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'name': {
      const dir = sort.direction === 'asc' ? 'asc_nulls_last' : 'desc_nulls_last';
      return [{ lsp4TokenName: { value: dir } }];
    }
    case 'symbol': {
      const dir = sort.direction === 'asc' ? 'asc_nulls_last' : 'desc_nulls_last';
      return [{ lsp4TokenSymbol: { value: dir } }];
    }
    case 'holderCount':
      return [{ ownedTokens_aggregate: { count: sort.direction } }];
    case 'creatorCount':
      return [{ lsp4Creators_aggregate: { count: sort.direction } }];
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single Digital Asset by address.
 *
 * Translates the address to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `DigitalAsset`, or `null` if
 * the address doesn't exist.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address)
 * @returns The parsed digital asset, or `null` if not found
 */
export async function fetchDigitalAsset(
  url: string,
  params: { address: string },
): Promise<DigitalAsset | null> {
  const result = await execute(url, GetDigitalAssetDocument, {
    where: { address: { _ilike: params.address } },
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
 * Fetch a paginated list of Digital Assets with filtering, sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed digital assets and total count
 */
export async function fetchDigitalAssets(
  url: string,
  params: {
    filter?: DigitalAssetFilter;
    sort?: DigitalAssetSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchDigitalAssetsResult> {
  const where = buildDigitalAssetWhere(params.filter);
  const orderBy = buildDigitalAssetOrderBy(params.sort);

  const result = await execute(url, GetDigitalAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    digitalAssets: parseDigitalAssets(result.digital_asset),
    totalCount: result.digital_asset_aggregate?.aggregate?.count ?? 0,
  };
}
