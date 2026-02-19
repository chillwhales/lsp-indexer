import type { EncryptedAsset, EncryptedAssetFilter, EncryptedAssetSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  GetEncryptedAssetDocument,
  GetEncryptedAssetsDocument,
} from '../documents/encrypted-assets';
import type {
  Lsp29_Encrypted_Asset_Bool_Exp,
  Lsp29_Encrypted_Asset_Order_By,
} from '../graphql/graphql';
import { parseEncryptedAsset, parseEncryptedAssets } from '../parsers/encrypted-assets';

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
 * Translate a flat `EncryptedAssetFilter` to a Hasura `lsp29_encrypted_asset_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `title`        → `{ title: { value: { _ilike: '%title%' } } }`
 * - `ownerAddress`  → `{ universal_profile_id: { _ilike: address } }`
 */
function buildEncryptedAssetWhere(filter?: EncryptedAssetFilter): Lsp29_Encrypted_Asset_Bool_Exp {
  if (!filter) return {};

  const conditions: Lsp29_Encrypted_Asset_Bool_Exp[] = [];

  if (filter.title) {
    conditions.push({
      title: { value: { _ilike: `%${escapeLike(filter.title)}%` } },
    });
  }

  if (filter.ownerAddress) {
    conditions.push({
      universal_profile_id: { _ilike: filter.ownerAddress },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `EncryptedAssetSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'title'`     → `[{ title: { value: direction_nulls_last } }]`
 * - `'timestamp'` → `[{ timestamp: direction }]`
 */
function buildEncryptedAssetOrderBy(
  sort?: EncryptedAssetSort,
): Lsp29_Encrypted_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'title': {
      const dir = sort.direction === 'asc' ? 'asc_nulls_last' : 'desc_nulls_last';
      return [{ title: { value: dir } }];
    }
    case 'timestamp':
      return [{ timestamp: sort.direction }];
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single LSP29 Encrypted Asset by address.
 *
 * Translates the address to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `EncryptedAsset`, or `null`
 * if the address doesn't exist.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address)
 * @returns The parsed encrypted asset, or `null` if not found
 */
export async function fetchEncryptedAsset(
  url: string,
  params: { address: string },
): Promise<EncryptedAsset | null> {
  const result = await execute(url, GetEncryptedAssetDocument, {
    where: { address: { _ilike: params.address } },
  });

  const raw = result.lsp29_encrypted_asset[0];
  return raw ? parseEncryptedAsset(raw) : null;
}

/**
 * Result shape for paginated encrypted asset list queries.
 */
export interface FetchEncryptedAssetsResult {
  /** Parsed encrypted assets for the current page */
  encryptedAssets: EncryptedAsset[];
  /** Total number of encrypted assets matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of LSP29 Encrypted Assets with filtering, sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the query,
 * and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed encrypted assets and total count
 */
export async function fetchEncryptedAssets(
  url: string,
  params: {
    filter?: EncryptedAssetFilter;
    sort?: EncryptedAssetSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchEncryptedAssetsResult> {
  const where = buildEncryptedAssetWhere(params.filter);
  const orderBy = buildEncryptedAssetOrderBy(params.sort);

  const result = await execute(url, GetEncryptedAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    encryptedAssets: parseEncryptedAssets(result.lsp29_encrypted_asset),
    totalCount: result.lsp29_encrypted_asset_aggregate?.aggregate?.count ?? 0,
  };
}
