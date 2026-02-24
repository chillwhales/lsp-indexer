import type {
  EncryptedAsset,
  EncryptedAssetFilter,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  EncryptedAssetSort,
  PartialEncryptedAsset,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetEncryptedAssetsDocument } from '../documents/encrypted-assets';
import type {
  Lsp29_Encrypted_Asset_Bool_Exp,
  Lsp29_Encrypted_Asset_Order_By,
} from '../graphql/graphql';
import { parseEncryptedAssets } from '../parsers/encrypted-assets';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, hasActiveIncludes, normalizeTimestamp, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `EncryptedAssetFilter` to a Hasura `lsp29_encrypted_asset_bool_exp`.
 *
 * All 8 filter fields — string fields use `_ilike` + `escapeLike` for
 * case-insensitive matching, numeric/timestamp fields use appropriate operators.
 *
 * Multiple conditions combine with `_and`. Empty filter = empty object.
 *
 * Filter → Hasura mapping:
 * - `address`              → `{ address: { _ilike: '%escapeLike%' } }` (direct field)
 * - `universalProfileName` → `{ universalProfile: { lsp3Profile: { name: { value: { _ilike } } } } }` (nested)
 * - `contentId`            → `{ content_id: { _ilike: '%escapeLike%' } }` (Hasura field is `content_id`)
 * - `revision`             → `{ revision: { _eq: value } }` (exact numeric match, NOT _ilike)
 * - `encryptionMethod`     → `{ encryption: { method: { _ilike: '%escapeLike%' } } }` (nested relation)
 * - `fileType`             → `{ file: { type: { _ilike: '%escapeLike%' } } }` (nested relation)
 * - `fileSize`             → `{ file: { size: { _gte: String(value) } } }` (numeric, minimum size)
 * - `timestamp`            → `{ timestamp: { _gte: normalizeTimestamp(value) } }` (lower bound)
 */
function buildEncryptedAssetWhere(filter?: EncryptedAssetFilter): Lsp29_Encrypted_Asset_Bool_Exp {
  if (!filter) return {};

  const conditions: Lsp29_Encrypted_Asset_Bool_Exp[] = [];

  if (filter.address) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.address)}%` },
    });
  }

  if (filter.universalProfileName) {
    conditions.push({
      universalProfile: {
        lsp3Profile: {
          name: { value: { _ilike: `%${escapeLike(filter.universalProfileName)}%` } },
        },
      },
    });
  }

  if (filter.contentId) {
    conditions.push({
      content_id: { _ilike: `%${escapeLike(filter.contentId)}%` },
    });
  }

  if (filter.revision != null) {
    conditions.push({
      revision: { _eq: filter.revision },
    });
  }

  if (filter.encryptionMethod) {
    conditions.push({
      encryption: {
        method: { _ilike: `%${escapeLike(filter.encryptionMethod)}%` },
      },
    });
  }

  if (filter.fileType) {
    conditions.push({
      file: {
        type: { _ilike: `%${escapeLike(filter.fileType)}%` },
      },
    });
  }

  if (filter.fileSize != null) {
    // Hasura `numeric` comparison expects string value in GraphQL (Scalars['numeric']['input'] = string)
    conditions.push({
      file: {
        size: { _gte: String(filter.fileSize) },
      },
    });
  }

  if (filter.timestamp != null) {
    conditions.push({
      timestamp: { _gte: normalizeTimestamp(filter.timestamp) },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `EncryptedAssetSort` to a Hasura `lsp29_encrypted_asset_order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'timestamp'`  → `[{ timestamp: dir }]`
 * - `'address'`    → `[{ address: dir }]`
 * - `'contentId'`  → `[{ content_id: dir }]`
 * - `'revision'`   → `[{ revision: dir }]`
 * - `'arrayIndex'` → `[{ array_index: dir }]`
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 * No nested sorts needed — all sort fields are direct columns.
 */
function buildEncryptedAssetOrderBy(
  sort?: EncryptedAssetSort,
): Lsp29_Encrypted_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'timestamp':
      return [{ timestamp: dir }];
    case 'address':
      return [{ address: dir }];
    case 'contentId':
      return [{ content_id: dir }];
    case 'revision':
      return [{ revision: dir }];
    case 'arrayIndex':
      return [{ array_index: dir }];
    default:
      return undefined;
  }
}

/**
 * Translate an `EncryptedAssetInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Encryption dual form handling:**
 * - `encryption: true` → `includeEncryption: true, includeEncryptionAccessControlConditions: true`
 * - `encryption: { accessControlConditions: true }` → both true
 * - `encryption: { accessControlConditions: false }` or `encryption: {}` → encryption true, ACC false
 * - `encryption: false` / omitted → both false
 *
 * **Profile sub-includes:** Reuses `buildProfileIncludeVars` with prefix replacement:
 * - `includeProfile*` → `includeUniversalProfile*` for universal profile sub-includes
 *
 * @param include - Optional include config; `undefined` = include everything
 * @returns Record of boolean variables for the GetEncryptedAssets GraphQL document
 */
export function buildEncryptedAssetIncludeVars(
  include?: EncryptedAssetInclude,
): Record<string, boolean> {
  if (!include) return {};

  const encryptionInclude = include.encryption;
  const isEncryptionIncluded =
    encryptionInclude === true ||
    (typeof encryptionInclude === 'object' && encryptionInclude != null);
  const includeAccessControlConditions =
    encryptionInclude === true ||
    (typeof encryptionInclude === 'object' && encryptionInclude?.accessControlConditions === true);

  const activeUniversalProfile = hasActiveIncludes(include.universalProfile);

  const vars: Record<string, boolean> = {
    // Scalars
    includeArrayIndex: include.arrayIndex ?? false,
    includeTimestamp: include.timestamp ?? false,

    // Boolean relations
    includeTitle: include.title ?? false,
    includeDescription: include.description ?? false,
    includeFile: include.file ?? false,
    includeChunks: include.chunks ?? false,
    includeImages: include.images ?? false,

    // Encryption — top-level + sub-toggle
    includeEncryption: isEncryptionIncluded,
    includeEncryptionAccessControlConditions: includeAccessControlConditions,

    // Universal Profile
    includeUniversalProfile: activeUniversalProfile,
  };

  // Universal Profile sub-includes: reuse profile builder with "UniversalProfile" prefix
  if (activeUniversalProfile) {
    const profileVars = buildProfileIncludeVars(include.universalProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      // includeProfileName → includeUniversalProfileName
      vars[key.replace('includeProfile', 'includeUniversalProfile')] = val;
    }
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated encrypted asset list queries.
 *
 * When the include parameter is provided, the `encryptedAssets` array contains
 * narrowed types with only base fields + included fields.
 */
export interface FetchEncryptedAssetsResult<P = EncryptedAsset> {
  /** Parsed encrypted asset records for the current page (narrowed by include) */
  encryptedAssets: P[];
  /** Total number of encrypted asset records matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of LSP29 encrypted asset records with filtering, sorting,
 * total count, and optional include narrowing.
 *
 * Serves both `useEncryptedAssets` (paginated) and `useInfiniteEncryptedAssets`
 * (infinite scroll) — the difference is how the hook manages pagination, not the
 * fetch function.
 *
 * No singular `fetchEncryptedAsset` exists because encrypted asset records have no
 * reliable natural key (user-introduced elements can share address + contentId +
 * revision). Developers query by filter instead.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed encrypted assets (narrowed by include) and total count
 */
export async function fetchEncryptedAssets(
  url: string,
  params?: {
    filter?: EncryptedAssetFilter;
    sort?: EncryptedAssetSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchEncryptedAssetsResult>;
export async function fetchEncryptedAssets<const I extends EncryptedAssetInclude>(
  url: string,
  params: {
    filter?: EncryptedAssetFilter;
    sort?: EncryptedAssetSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchEncryptedAssetsResult<EncryptedAssetResult<I>>>;
export async function fetchEncryptedAssets(
  url: string,
  params: {
    filter?: EncryptedAssetFilter;
    sort?: EncryptedAssetSort;
    limit?: number;
    offset?: number;
    include?: EncryptedAssetInclude;
  },
): Promise<FetchEncryptedAssetsResult<PartialEncryptedAsset>>;
export async function fetchEncryptedAssets(
  url: string,
  params: {
    filter?: EncryptedAssetFilter;
    sort?: EncryptedAssetSort;
    limit?: number;
    offset?: number;
    include?: EncryptedAssetInclude;
  } = {},
): Promise<FetchEncryptedAssetsResult<PartialEncryptedAsset>> {
  const where = buildEncryptedAssetWhere(params.filter);
  const orderBy = buildEncryptedAssetOrderBy(params.sort);
  const includeVars = buildEncryptedAssetIncludeVars(params.include);

  const result = await execute(url, GetEncryptedAssetsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      encryptedAssets: parseEncryptedAssets(result.lsp29_encrypted_asset, params.include),
      totalCount: result.lsp29_encrypted_asset_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    encryptedAssets: parseEncryptedAssets(result.lsp29_encrypted_asset),
    totalCount: result.lsp29_encrypted_asset_aggregate?.aggregate?.count ?? 0,
  };
}
