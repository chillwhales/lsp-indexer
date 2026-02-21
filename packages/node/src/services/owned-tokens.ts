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
import { buildNftIncludeVars } from './nfts';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, hasActiveIncludes, orderDir } from './utils';

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
 * - `owner`     → `{ owner: { _ilike: '%owner%' } }`
 * - `address`   → `{ address: { _ilike: '%address%' } }`
 * - `tokenId`   → `{ token_id: { _ilike: '%tokenId%' } }` (snake_case column)
 * - `assetName` → `{ digitalAsset: { lsp4TokenName: { value: { _ilike: '%name%' } } } }`
 * - `tokenName` → `{ nft: { _or: [lsp4Metadata.name, lsp4MetadataBaseUri.name] } }`
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

  if (filter.assetName) {
    conditions.push({
      digitalAsset: {
        lsp4TokenName: { value: { _ilike: `%${escapeLike(filter.assetName)}%` } },
      },
    });
  }

  if (filter.tokenName) {
    const namePattern = `%${escapeLike(filter.tokenName)}%`;
    conditions.push({
      nft: {
        _or: [
          { lsp4Metadata: { name: { value: { _ilike: namePattern } } } },
          { lsp4MetadataBaseUri: { name: { value: { _ilike: namePattern } } } },
        ],
      },
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
 * **Nested relation sub-includes:**
 * - `digitalAsset`: Only included when at least one sub-field is truthy → 17 DA sub-variables.
 * - `nft`: Only included when at least one sub-field is truthy → 8 NFT sub-variables.
 * - `universalProfile`: Only included when at least one sub-field is truthy → 9 profile sub-variables.
 *
 * `undefined`, `{}`, and all-false objects all resolve to `false` for the parent relation.
 */
function buildIncludeVars(include?: OwnedTokenInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const activeDA = hasActiveIncludes(include.digitalAsset);
  const activeNft = hasActiveIncludes(include.nft);
  const activeUP = hasActiveIncludes(include.universalProfile);

  const vars: Record<string, boolean> = {
    includeDigitalAsset: activeDA,
    includeNft: activeNft,
    includeOwnedAsset: include.ownedAsset ?? false,
    includeUniversalProfile: activeUP,
  };

  // Digital asset sub-includes: reuse digital asset include builder.
  if (activeDA) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    Object.assign(vars, daVars);
  }

  // NFT sub-includes: reuse NFT include builder with includeNft* prefix.
  if (activeNft) {
    const nftVars = buildNftIncludeVars(include.nft);
    Object.assign(vars, nftVars);
  }

  // Profile sub-includes: reuse profile include builder with includeProfile* prefix.
  if (activeUP) {
    const profileVars = buildProfileIncludeVars(include.universalProfile);
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
