import type {
  OwnedAsset,
  OwnedAssetFilter,
  OwnedAssetSort,
  OwnedToken,
  OwnedTokenFilter,
  OwnedTokenSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetOwnedAssetsDocument, GetOwnedTokensDocument } from '../documents/owned-assets';
import type {
  Owned_Asset_Bool_Exp,
  Owned_Asset_Order_By,
  Owned_Token_Bool_Exp,
  Owned_Token_Order_By,
} from '../graphql/graphql';
import { parseOwnedAssets, parseOwnedTokens } from '../parsers/owned-assets';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `OwnedAssetFilter` to a Hasura `owned_asset_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `ownerAddress` → `{ owner: { _ilike: ownerAddress } }`
 * - `assetAddress` → `{ address: { _ilike: assetAddress } }`
 */
export function buildOwnedAssetWhere(filter?: OwnedAssetFilter): Owned_Asset_Bool_Exp {
  if (!filter) return {};

  const conditions: Owned_Asset_Bool_Exp[] = [];

  if (filter.ownerAddress) {
    conditions.push({
      owner: { _ilike: filter.ownerAddress },
    });
  }

  if (filter.assetAddress) {
    conditions.push({
      address: { _ilike: filter.assetAddress },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `OwnedAssetSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'assetAddress'` → `[{ address: direction }]`
 * - `'balance'`      → `[{ balance: direction }]`
 */
function buildOwnedAssetOrderBy(sort?: OwnedAssetSort): Owned_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'assetAddress':
      return [{ address: sort.direction }];
    case 'balance':
      return [{ balance: sort.direction }];
    default:
      return undefined;
  }
}

/**
 * Translate a flat `OwnedTokenFilter` to a Hasura `owned_token_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `ownerAddress` → `{ owner: { _ilike: ownerAddress } }`
 * - `assetAddress` → `{ address: { _ilike: assetAddress } }`
 * - `tokenId`      → `{ token_id: { _ilike: tokenId } }`
 */
export function buildOwnedTokenWhere(filter?: OwnedTokenFilter): Owned_Token_Bool_Exp {
  if (!filter) return {};

  const conditions: Owned_Token_Bool_Exp[] = [];

  if (filter.ownerAddress) {
    conditions.push({
      owner: { _ilike: filter.ownerAddress },
    });
  }

  if (filter.assetAddress) {
    conditions.push({
      address: { _ilike: filter.assetAddress },
    });
  }

  if (filter.tokenId) {
    conditions.push({
      token_id: { _ilike: filter.tokenId },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `OwnedTokenSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'assetAddress'` → `[{ address: direction }]`
 * - `'tokenId'`      → `[{ token_id: direction }]`
 */
function buildOwnedTokenOrderBy(sort?: OwnedTokenSort): Owned_Token_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'assetAddress':
      return [{ address: sort.direction }];
    case 'tokenId':
      return [{ token_id: sort.direction }];
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated owned asset list queries.
 */
export interface FetchOwnedAssetsResult {
  /** Parsed owned assets for the current page */
  ownedAssets: OwnedAsset[];
  /** Total number of owned assets matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of owned assets (LSP7 fungible tokens) with filtering,
 * sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed owned assets and total count
 */
export async function fetchOwnedAssets(
  url: string,
  params: {
    filter?: OwnedAssetFilter;
    sort?: OwnedAssetSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchOwnedAssetsResult> {
  const where = buildOwnedAssetWhere(params.filter);
  const orderBy = buildOwnedAssetOrderBy(params.sort);

  const result = await execute(url, GetOwnedAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    ownedAssets: parseOwnedAssets(result.owned_asset),
    totalCount: result.owned_asset_aggregate?.aggregate?.count ?? 0,
  };
}

/**
 * Result shape for paginated owned token list queries.
 */
export interface FetchOwnedTokensResult {
  /** Parsed owned tokens for the current page */
  ownedTokens: OwnedToken[];
  /** Total number of owned tokens matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of owned tokens (LSP8 NFTs) with filtering,
 * sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed owned tokens and total count
 */
export async function fetchOwnedTokens(
  url: string,
  params: {
    filter?: OwnedTokenFilter;
    sort?: OwnedTokenSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchOwnedTokensResult> {
  const where = buildOwnedTokenWhere(params.filter);
  const orderBy = buildOwnedTokenOrderBy(params.sort);

  const result = await execute(url, GetOwnedTokensDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    ownedTokens: parseOwnedTokens(result.owned_token),
    totalCount: result.owned_token_aggregate?.aggregate?.count ?? 0,
  };
}
