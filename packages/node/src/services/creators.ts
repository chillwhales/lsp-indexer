import type { Creator, CreatorFilter, CreatorSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetCreatorAddressesDocument } from '../documents/creators';
import type { Lsp4_Creator_Bool_Exp, Lsp4_Creator_Order_By } from '../graphql/graphql';
import { parseCreators } from '../parsers/creators';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `CreatorFilter` to a Hasura `lsp4_creator_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `assetAddress`   → `{ address: { _ilike: assetAddress } }`
 * - `creatorAddress`  → `{ creator_address: { _ilike: creatorAddress } }`
 */
function buildCreatorWhere(filter?: CreatorFilter): Lsp4_Creator_Bool_Exp {
  if (!filter) return {};

  const conditions: Lsp4_Creator_Bool_Exp[] = [];

  if (filter.assetAddress) {
    conditions.push({
      address: { _ilike: filter.assetAddress },
    });
  }

  if (filter.creatorAddress) {
    conditions.push({
      creator_address: { _ilike: filter.creatorAddress },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `CreatorSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'assetAddress'`    → `[{ address: direction }]`
 * - `'creatorAddress'`  → `[{ creator_address: direction }]`
 */
function buildCreatorOrderBy(sort?: CreatorSort): Lsp4_Creator_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'assetAddress':
      return [{ address: sort.direction }];
    case 'creatorAddress':
      return [{ creator_address: sort.direction }];
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated creator list queries.
 */
export interface FetchCreatorAddressesResult {
  /** Parsed creators for the current page */
  creators: Creator[];
  /** Total number of creators matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of LSP4 creators with filtering, sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed creators and total count
 */
export async function fetchCreatorAddresses(
  url: string,
  params: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchCreatorAddressesResult> {
  const where = buildCreatorWhere(params.filter);
  const orderBy = buildCreatorOrderBy(params.sort);

  const result = await execute(url, GetCreatorAddressesDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    creators: parseCreators(result.lsp4_creator),
    totalCount: result.lsp4_creator_aggregate?.aggregate?.count ?? 0,
  };
}
