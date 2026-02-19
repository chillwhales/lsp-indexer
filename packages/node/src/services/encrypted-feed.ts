import type {
  EncryptedFeedEntry,
  EncryptedFeedFilter,
  EncryptedFeedSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetEncryptedAssetFeedDocument } from '../documents/encrypted-feed';
import type {
  Lsp29_Encrypted_Asset_Entry_Bool_Exp,
  Lsp29_Encrypted_Asset_Entry_Order_By,
} from '../graphql/graphql';
import { parseEncryptedFeedEntries } from '../parsers/encrypted-feed';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `EncryptedFeedFilter` to a Hasura `lsp29_encrypted_asset_entry_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `address`            → `{ address: { _ilike: value } }`
 * - `universalProfileId` → `{ universal_profile_id: { _ilike: value } }`
 */
function buildEncryptedFeedWhere(
  filter?: EncryptedFeedFilter,
): Lsp29_Encrypted_Asset_Entry_Bool_Exp {
  if (!filter) return {};

  const conditions: Lsp29_Encrypted_Asset_Entry_Bool_Exp[] = [];

  if (filter.address) {
    conditions.push({
      address: { _ilike: filter.address },
    });
  }

  if (filter.universalProfileId) {
    conditions.push({
      universal_profile_id: { _ilike: filter.universalProfileId },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `EncryptedFeedSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'timestamp'`  → `[{ timestamp: direction }]`
 * - `'arrayIndex'` → `[{ array_index: direction }]`
 * - `'address'`    → `[{ address: direction }]`
 */
function buildEncryptedFeedOrderBy(
  sort?: EncryptedFeedSort,
): Lsp29_Encrypted_Asset_Entry_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'timestamp':
      return [{ timestamp: sort.direction }];
    case 'arrayIndex':
      return [{ array_index: sort.direction }];
    case 'address':
      return [{ address: sort.direction }];
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated encrypted feed entry queries.
 */
export interface FetchEncryptedAssetFeedResult {
  /** Parsed feed entries for the current page */
  entries: EncryptedFeedEntry[];
  /** Total number of entries matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of LSP29 Encrypted Asset Feed Entries with filtering,
 * sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the query,
 * and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed feed entries and total count
 */
export async function fetchEncryptedAssetFeed(
  url: string,
  params: {
    filter?: EncryptedFeedFilter;
    sort?: EncryptedFeedSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchEncryptedAssetFeedResult> {
  const where = buildEncryptedFeedWhere(params.filter);
  const orderBy = buildEncryptedFeedOrderBy(params.sort);

  const result = await execute(url, GetEncryptedAssetFeedDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    entries: parseEncryptedFeedEntries(result.lsp29_encrypted_asset_entry),
    totalCount: result.lsp29_encrypted_asset_entry_aggregate?.aggregate?.count ?? 0,
  };
}
