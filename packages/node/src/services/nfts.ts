import type { Nft, NftFilter, NftInclude, NftSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetNftDocument, GetNftsDocument } from '../documents/nfts';
import type { Nft_Bool_Exp, Nft_Order_By } from '../graphql/graphql';
import { parseNft, parseNfts } from '../parsers/nfts';
import { escapeLike, orderDir } from './utils';

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
 * - `collectionAddress` → `{ address: { _ilike: escapeLike(collectionAddress) } }`
 *   (case-insensitive exact match — the nft.address IS the collection address)
 * - `tokenId`           → `{ token_id: { _ilike: escapeLike(tokenId) } }`
 * - `ownerAddress`      → `{ ownedToken: { owner: { _ilike: escapeLike(ownerAddress) } } }`
 * - `isBurned`          → `{ is_burned: { _eq: isBurned } }`
 * - `isMinted`          → `{ is_minted: { _eq: isMinted } }`
 */
function buildNftWhere(filter?: NftFilter): Nft_Bool_Exp {
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

  if (filter.ownerAddress) {
    conditions.push({
      ownedToken: {
        owner: { _ilike: escapeLike(filter.ownerAddress) },
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

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `NftSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'tokenId'`          → `[{ token_id: dir }]`
 * - `'formattedTokenId'` → `[{ formatted_token_id: dir }]` — defaults nulls last
 *                           since formatted_token_id can be null
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildNftOrderBy(sort?: NftSort): Nft_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'tokenId':
      return [{ token_id: orderDir(sort.direction, sort.nulls) }];
    case 'formattedTokenId':
      return [{ formatted_token_id: orderDir(sort.direction, sort.nulls ?? 'last') }];
    default:
      return undefined;
  }
}

/**
 * Translate a `NftInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 */
function buildIncludeVars(include?: NftInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  return {
    includeFormattedTokenId: include.formattedTokenId ?? false,
    includeCollection: include.collection ?? false,
    includeOwner: include.owner ?? false,
    includeDescription: include.description ?? false,
    includeCategory: include.category ?? false,
    includeIcons: include.icons ?? false,
    includeImages: include.images ?? false,
    includeLinks: include.links ?? false,
    includeAttributes: include.attributes ?? false,
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single NFT by collection address and token ID.
 *
 * Translates the composite key to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `Nft`, or `null` if the
 * (address, tokenId) pair doesn't exist.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address + tokenId + optional include)
 * @returns The parsed NFT, or `null` if not found
 */
export async function fetchNft(
  url: string,
  params: { address: string; tokenId: string; include?: NftInclude },
): Promise<Nft | null> {
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetNftDocument, {
    where: {
      _and: [
        { address: { _ilike: escapeLike(params.address) } },
        { token_id: { _ilike: escapeLike(params.tokenId) } },
      ],
    },
    ...includeVars,
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
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed NFTs and total count
 */
export async function fetchNfts(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
    include?: NftInclude;
  } = {},
): Promise<FetchNftsResult> {
  const where = buildNftWhere(params.filter);
  const orderBy = buildNftOrderBy(params.sort);
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetNftsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  return {
    nfts: parseNfts(result.nft),
    totalCount: result.nft_aggregate?.aggregate?.count ?? 0,
  };
}
