import type {
  OwnedToken,
  OwnedTokenFilter,
  OwnedTokenInclude,
  OwnedTokenSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetOwnedTokenDocument, GetOwnedTokensDocument } from '../documents/owned-tokens';
import type { Owned_Token_Bool_Exp, Owned_Token_Order_By } from '../graphql/graphql';
import { parseOwnedToken, parseOwnedTokens } from '../parsers/owned-tokens';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `OwnedTokenFilter` to a Hasura `owned_token_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `owner`              → `{ owner: { _ilike: '%owner%' } }`
 * - `address`            → `{ address: { _ilike: '%address%' } }`
 * - `tokenId`            → `{ token_id: { _ilike: '%tokenId%' } }` (snake_case column)
 * - `digitalAssetId`     → `{ digital_asset_id: { _ilike: '%digitalAssetId%' } }`
 * - `nftId`              → `{ nft_id: { _ilike: '%nftId%' } }`
 * - `ownedAssetId`       → `{ owned_asset_id: { _ilike: '%ownedAssetId%' } }`
 * - `universalProfileId` → `{ universal_profile_id: { _ilike: '%universalProfileId%' } }`
 *
 * All string fields use `_ilike` + `escapeLike` for case-insensitive matching
 * (EIP-55 mixed-case address prevention).
 */
function buildWhere(filter?: OwnedTokenFilter): Owned_Token_Bool_Exp {
  if (!filter) return {};

  const conditions: Owned_Token_Bool_Exp[] = [];

  if (filter.owner) {
    conditions.push({
      owner: { _ilike: `%${escapeLike(filter.owner)}%` },
    });
  }

  if (filter.address) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.address)}%` },
    });
  }

  if (filter.tokenId) {
    conditions.push({
      token_id: { _ilike: `%${escapeLike(filter.tokenId)}%` },
    });
  }

  if (filter.digitalAssetId) {
    conditions.push({
      digital_asset_id: { _ilike: `%${escapeLike(filter.digitalAssetId)}%` },
    });
  }

  if (filter.nftId) {
    conditions.push({
      nft_id: { _ilike: `%${escapeLike(filter.nftId)}%` },
    });
  }

  if (filter.ownedAssetId) {
    conditions.push({
      owned_asset_id: { _ilike: `%${escapeLike(filter.ownedAssetId)}%` },
    });
  }

  if (filter.universalProfileId) {
    conditions.push({
      universal_profile_id: { _ilike: `%${escapeLike(filter.universalProfileId)}%` },
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
 * - Direct columns: `address`, `block`, `owner`, `timestamp` → `[{ [field]: dir }]`
 * - `tokenId` → `[{ token_id: dir }]` (snake_case in Hasura)
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildOrderBy(sort?: OwnedTokenSort): Owned_Token_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'address':
    case 'block':
    case 'owner':
    case 'timestamp':
      return [{ [sort.field]: dir }];
    case 'tokenId':
      return [{ token_id: dir }];
    default:
      return undefined;
  }
}

/**
 * Translate an `OwnedTokenInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Digital asset sub-includes:**
 * - When `include.digitalAsset` is **provided** (even as `{}`) → `includeDigitalAsset: true`
 *   with sub-include variables from `buildDigitalAssetIncludeVars`.
 * - When `include.digitalAsset` is **undefined** → `includeDigitalAsset: false`.
 */
function buildIncludeVars(include?: OwnedTokenInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const vars: Record<string, boolean> = {
    includeDigitalAsset: include.digitalAsset !== undefined, // provided (even {}) = include
    includeNft: include.nft ?? false,
    includeOwnedAsset: include.ownedAsset ?? false,
    includeUniversalProfile: include.universalProfile !== undefined, // provided (even {}) = include
  };

  // Digital asset sub-includes: reuse digital asset include builder.
  // When digitalAsset is empty {} → buildDigitalAssetIncludeVars returns {} → GraphQL defaults apply.
  // When digitalAsset has explicit keys → each key is mapped to include* variables.
  if (include.digitalAsset) {
    const daVars = buildDigitalAssetIncludeVars(
      Object.keys(include.digitalAsset).length > 0 ? include.digitalAsset : undefined,
    );
    Object.assign(vars, daVars);
  }

  // Profile sub-includes: reuse profile include builder with includeProfile* prefix.
  // Same pattern as digital asset sub-includes.
  if (include.universalProfile) {
    const profileVars = buildProfileIncludeVars(
      Object.keys(include.universalProfile).length > 0 ? include.universalProfile : undefined,
    );
    Object.assign(vars, profileVars);
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single owned token by ID.
 *
 * Translates the ID to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `OwnedToken`, or `null` if
 * the ID doesn't exist.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (id + optional include)
 * @returns The parsed owned token, or `null` if not found
 */
export async function fetchOwnedToken(
  url: string,
  params: { id: string; include?: OwnedTokenInclude },
): Promise<OwnedToken | null> {
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedTokenDocument, {
    where: { id: { _eq: params.id } },
    ...includeVars,
  });

  const raw = result.owned_token[0];
  return raw ? parseOwnedToken(raw) : null;
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
 * Fetch a paginated list of owned tokens with filtering, sorting, and total count.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed owned tokens and total count
 */
export async function fetchOwnedTokens(
  url: string,
  params: {
    filter?: OwnedTokenFilter;
    sort?: OwnedTokenSort;
    limit?: number;
    offset?: number;
    include?: OwnedTokenInclude;
  } = {},
): Promise<FetchOwnedTokensResult> {
  const where = buildWhere(params.filter);
  const orderBy = buildOrderBy(params.sort);
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetOwnedTokensDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  return {
    ownedTokens: parseOwnedTokens(result.owned_token),
    totalCount: result.owned_token_aggregate?.aggregate?.count ?? 0,
  };
}
