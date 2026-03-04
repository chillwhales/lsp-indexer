import type {
  Nft,
  NftFilter,
  NftInclude,
  NftResult,
  NftSort,
  OwnedTokenNftInclude,
  PartialNft,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetNftDocument, GetNftsDocument, NftSubscriptionDocument } from '../documents/nfts';
import type { NftSubscriptionSubscription, Nft_Bool_Exp, Nft_Order_By } from '../graphql/graphql';
import { parseNft, parseNfts } from '../parsers/nfts';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, hasActiveIncludes, orderDir } from './utils';

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
 * - `formattedTokenId`  → `{ formatted_token_id: { _ilike: escapeLike(formattedTokenId) } }`
 * - `name`              → `{ _or: [lsp4Metadata.name, lsp4MetadataBaseUri.name] }` (search both)
 * - `holderAddress`     → `{ ownedToken: { owner: { _ilike: escapeLike(holderAddress) } } }`
 * - `isBurned`          → `{ is_burned: { _eq: isBurned } }`
 * - `isMinted`          → `{ is_minted: { _eq: isMinted } }`
 */
export function buildNftWhere(filter?: NftFilter): Nft_Bool_Exp {
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

  if (filter.formattedTokenId) {
    conditions.push({
      formatted_token_id: { _ilike: escapeLike(filter.formattedTokenId) },
    });
  }

  if (filter.name) {
    const namePattern = `%${escapeLike(filter.name)}%`;
    conditions.push({
      _or: [
        { lsp4Metadata: { name: { value: { _ilike: namePattern } } } },
        { lsp4MetadataBaseUri: { name: { value: { _ilike: namePattern } } } },
      ],
    });
  }

  if (filter.holderAddress) {
    conditions.push({
      ownedToken: {
        owner: { _ilike: escapeLike(filter.holderAddress) },
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
export function buildNftOrderBy(sort?: NftSort): Nft_Order_By[] | undefined {
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
 *
 * **Collection sub-includes:**
 * - When `include.collection` has at least one truthy sub-field → `includeCollection: true`
 *   with sub-include variables from the DigitalAssetInclude schema.
 * - When `include.collection` is `undefined`, `{}`, or all-false → `includeCollection: false`.
 *
 * **Holder sub-includes:**
 * - Same pattern as collection — only included when at least one sub-field is truthy.
 */
function buildIncludeVars(include?: NftInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all Boolean! = true)
    return {};
  }

  const activeCollection = hasActiveIncludes(include.collection);
  const activeHolder = hasActiveIncludes(include.holder);

  const vars: Record<string, boolean> = {
    includeFormattedTokenId: include.formattedTokenId ?? false,
    includeName: include.name ?? false,
    includeCollection: activeCollection,
    includeHolder: activeHolder,
    includeDescription: include.description ?? false,
    includeCategory: include.category ?? false,
    includeIcons: include.icons ?? false,
    includeImages: include.images ?? false,
    includeLinks: include.links ?? false,
    includeAttributes: include.attributes ?? false,
  };

  // Collection sub-includes: reuse digital asset include builder with "Collection" prefix.
  if (activeCollection) {
    const daVars = buildDigitalAssetIncludeVars(include.collection);
    for (const [key, val] of Object.entries(daVars)) {
      // includeX → includeCollectionX
      vars[key.replace('include', 'includeCollection')] = val;
    }
  }

  // Holder sub-includes: reuse profile include builder with "Holder" prefix.
  if (activeHolder) {
    const profileVars = buildProfileIncludeVars(include.holder);
    for (const [key, val] of Object.entries(profileVars)) {
      // includeProfileX → includeHolderX
      vars[key.replace('includeProfile', 'includeHolder')] = val;
    }
  }

  return vars;
}

/**
 * Build NFT sub-include variables for use as a **nested relation** in the owned-token
 * domain. Uses `includeNft*` prefix to avoid colliding with digital asset `include*`
 * and profile `includeProfile*` variables which share the same query.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`.
 *
 * Only maps the 8 fields available in the owned-token NFT context
 * (excludes `collection` and `holder` which are sibling relations on owned_token).
 */
export function buildNftIncludeVars(
  include?: boolean | OwnedTokenNftInclude,
): Record<string, boolean> {
  if (!include) {
    return {};
  }
  // true = include everything → return empty (GraphQL defaults all to true)
  if (include === true) {
    return {};
  }

  return {
    includeNftFormattedTokenId: include.formattedTokenId ?? false,
    includeNftName: include.name ?? false,
    includeNftDescription: include.description ?? false,
    includeNftCategory: include.category ?? false,
    includeNftIcons: include.icons ?? false,
    includeNftImages: include.images ?? false,
    includeNftLinks: include.links ?? false,
    includeNftAttributes: include.attributes ?? false,
  };
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

/**
 * Raw Hasura row type from the subscription codegen result.
 *
 * Structurally compatible with the query-side raw rows (both select
 * the same fields), but derived from the subscription codegen type to
 * keep the generic chain `TResult → TRaw` precise.
 */
type RawNftSubscriptionRow = NftSubscriptionSubscription['nft'][number];

/**
 * Build an NFT subscription config (document, variables, extract, parser).
 *
 * Encapsulates the domain-specific assembly that `createUseNftSubscription`
 * needs — mirroring how `fetchNfts` encapsulates query assembly. Keeps the
 * React hook factory focused on hook lifecycle rather than domain plumbing.
 *
 * @param params - Filter, sort, limit, and include configuration
 * @returns A config object consumable by `useSubscription`
 */
export function buildNftSubscriptionConfig(params: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  include?: NftInclude;
}) {
  const where = buildNftWhere(params.filter);
  const orderBy = buildNftOrderBy(params.sort);
  const includeVars = buildIncludeVars(params.include);

  return {
    document: NftSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: NftSubscriptionSubscription) => result.nft,
    parser: (raw: RawNftSubscriptionRow[]) =>
      params.include ? parseNfts(raw, params.include) : parseNfts(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single NFT by collection address and token ID (or formatted token ID).
 *
 * Translates the composite key to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `Nft`, or `null` if not found.
 *
 * Supports searching by either `tokenId` or `formattedTokenId` (or both).
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address + tokenId/formattedTokenId + optional include)
 * @returns The parsed NFT, or `null` if not found
 */
export async function fetchNft(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string },
): Promise<Nft | null>;
export async function fetchNft<const I extends NftInclude>(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string; include: I },
): Promise<NftResult<I> | null>;
export async function fetchNft(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string; include?: NftInclude },
): Promise<PartialNft | null>;
export async function fetchNft(
  url: string,
  params: { address: string; tokenId?: string; formattedTokenId?: string; include?: NftInclude },
): Promise<PartialNft | null> {
  if (!params.tokenId && !params.formattedTokenId) {
    throw new Error('fetchNft requires at least one of tokenId or formattedTokenId');
  }

  const includeVars = buildIncludeVars(params.include);

  const conditions: Nft_Bool_Exp[] = [{ address: { _ilike: escapeLike(params.address) } }];

  if (params.tokenId) {
    conditions.push({ token_id: { _ilike: escapeLike(params.tokenId) } });
  }

  if (params.formattedTokenId) {
    conditions.push({
      formatted_token_id: { _ilike: escapeLike(params.formattedTokenId) },
    });
  }

  const result = await execute(url, GetNftDocument, {
    where: conditions.length === 1 ? conditions[0]! : { _and: conditions },
    ...includeVars,
  });

  const raw = result.nft[0];
  if (!raw) return null;
  if (params.include) return parseNft(raw, params.include);
  return parseNft(raw);
}

/**
 * Result shape for paginated NFT list queries.
 *
 * When the include parameter `I` is provided, the `nfts` array contains
 * narrowed types with only base fields + included fields.
 */
export interface FetchNftsResult<P = Nft> {
  /** Parsed NFTs for the current page (narrowed by include) */
  nfts: P[];
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
  params?: { filter?: NftFilter; sort?: NftSort; limit?: number; offset?: number },
): Promise<FetchNftsResult>;
export async function fetchNfts<const I extends NftInclude>(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchNftsResult<NftResult<I>>>;
export async function fetchNfts(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
    include?: NftInclude;
  },
): Promise<FetchNftsResult<PartialNft>>;
export async function fetchNfts(
  url: string,
  params: {
    filter?: NftFilter;
    sort?: NftSort;
    limit?: number;
    offset?: number;
    include?: NftInclude;
  } = {},
): Promise<FetchNftsResult<PartialNft>> {
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

  if (params.include) {
    return {
      nfts: parseNfts(result.nft, params.include),
      totalCount: result.nft_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    nfts: parseNfts(result.nft),
    totalCount: result.nft_aggregate?.aggregate?.count ?? 0,
  };
}
