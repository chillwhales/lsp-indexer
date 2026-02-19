import type { Nft, NftFilter, NftSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetNftDocument, GetNftsDocument } from '../documents/nfts';
import type { Nft_Bool_Exp, Nft_Order_By } from '../graphql/graphql';
import { parseNft, parseNfts } from '../parsers/nfts';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `NftFilter` to a Hasura `nft_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `collectionAddress` → `{ address: { _ilike: collectionAddress } }`
 * - `ownerAddress`      → `{ ownedToken: { owner: { _ilike: ownerAddress } } }`
 * - `tokenId`           → `{ token_id: { _ilike: tokenId } }`
 */
function buildNftWhere(filter?: NftFilter): Nft_Bool_Exp {
  if (!filter) return {};

  const conditions: Nft_Bool_Exp[] = [];

  if (filter.collectionAddress) {
    conditions.push({
      address: { _ilike: filter.collectionAddress },
    });
  }

  if (filter.ownerAddress) {
    conditions.push({
      ownedToken: { owner: { _ilike: filter.ownerAddress } },
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
 * Translate a flat `NftSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'tokenId'` → `[{ token_id: direction }]`
 * - `'name'`    → `[{ lsp4Metadata: { name: { value: direction_nulls_last } } }]`
 */
function buildNftOrderBy(sort?: NftSort): Nft_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'tokenId':
      return [{ token_id: sort.direction }];
    case 'name': {
      const dir = sort.direction === 'asc' ? 'asc_nulls_last' : 'desc_nulls_last';
      return [{ lsp4Metadata: { name: { value: dir } } }];
    }
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single NFT by collection address and token ID.
 *
 * Translates the address and tokenId to a Hasura `where` clause with `_ilike`
 * for case-insensitive matching, executes the query, and returns the first
 * result parsed as a clean `Nft`, or `null` if not found.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address + tokenId)
 * @returns The parsed NFT, or `null` if not found
 */
export async function fetchNft(
  url: string,
  params: { address: string; tokenId: string },
): Promise<Nft | null> {
  const result = await execute(url, GetNftDocument, {
    where: {
      address: { _ilike: params.address },
      token_id: { _ilike: params.tokenId },
    },
  });

  const raw = result.nft[0];
  return raw ? parseNft(raw) : null;
}

/**
 * Result shape for paginated NFT list queries.
 */
export interface FetchNftsResult {
  /** Parsed NFTs for the current page */
  nfts: Nft[];
  /** Total number of NFTs matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of NFTs with filtering, sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed NFTs and total count
 */
export async function fetchNfts(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchNftsResult> {
  const where = buildNftWhere(params.filter);
  const orderBy = buildNftOrderBy(params.sort);

  const result = await execute(url, GetNftsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    nfts: parseNfts(result.nft),
    totalCount: result.nft_aggregate?.aggregate?.count ?? 0,
  };
}
