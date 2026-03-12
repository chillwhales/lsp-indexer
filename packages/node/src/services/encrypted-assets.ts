import type {
  EncryptedAsset,
  EncryptedAssetFilter,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  EncryptedAssetSort,
  PartialEncryptedAsset,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  EncryptedAssetSubscriptionDocument,
  GetEncryptedAssetsDocument,
} from '../documents/encrypted-assets';
import type {
  EncryptedAssetSubscriptionSubscription,
  Lsp29_Encrypted_Asset_Bool_Exp,
  Lsp29_Encrypted_Asset_Order_By,
} from '../graphql/graphql';
import { parseEncryptedAssets } from '../parsers/encrypted-assets';
import { buildProfileIncludeVars } from './profiles';
import {
  buildBlockOrderSort,
  escapeLike,
  hasActiveIncludes,
  normalizeTimestamp,
  orderDir,
} from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate EncryptedAssetFilter to a Hasura _bool_exp. */
export function buildEncryptedAssetWhere(
  filter?: EncryptedAssetFilter,
): Lsp29_Encrypted_Asset_Bool_Exp {
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
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate EncryptedAssetSort to a Hasura order_by. */
function buildEncryptedAssetOrderBy(
  sort?: EncryptedAssetSort,
): Lsp29_Encrypted_Asset_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
    case 'address':
      return [{ address: dir }, ...buildBlockOrderSort('desc')];
    case 'contentId':
      return [{ content_id: dir }, ...buildBlockOrderSort('desc')];
    case 'revision':
      return [{ revision: dir }, ...buildBlockOrderSort('desc')];
    case 'arrayIndex':
      return [{ array_index: dir }, ...buildBlockOrderSort('desc')];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
export function buildEncryptedAssetIncludeVars(
  include?: EncryptedAssetInclude,
): Record<string, boolean> {
  if (!include) return {};

  // Encryption: boolean | object | undefined → inline dual-form resolution
  const encInc = include.encryption;
  const isEncIncluded = encInc === true || (typeof encInc === 'object' && encInc != null);
  const encObj = typeof encInc === 'object' && encInc != null ? encInc : undefined;

  // File: boolean | object | undefined
  const fileInc = include.file;
  const isFileIncluded = fileInc === true || (typeof fileInc === 'object' && fileInc != null);
  const fileObj = typeof fileInc === 'object' && fileInc != null ? fileInc : undefined;

  // Chunks: boolean | object | undefined
  const chunksInc = include.chunks;
  const isChunksIncluded =
    chunksInc === true || (typeof chunksInc === 'object' && chunksInc != null);
  const chunksObj = typeof chunksInc === 'object' && chunksInc != null ? chunksInc : undefined;

  const activeUniversalProfile = hasActiveIncludes(include.universalProfile);

  const vars: Record<string, boolean> = {
    // Scalars
    includeArrayIndex: include.arrayIndex ?? false,
    includeTimestamp: include.timestamp ?? false,

    // Boolean relations
    includeTitle: include.title ?? false,
    includeDescription: include.description ?? false,
    includeImages: include.images ?? false,

    // Encryption — top-level + per-sub-field toggles
    includeEncryption: isEncIncluded,
    includeEncryptionMethod: encInc === true || (encObj?.method ?? false),
    includeEncryptionCiphertext: encInc === true || (encObj?.ciphertext ?? false),
    includeEncryptionDataToEncryptHash: encInc === true || (encObj?.dataToEncryptHash ?? false),
    includeEncryptionDecryptionCode: encInc === true || (encObj?.decryptionCode ?? false),
    includeEncryptionDecryptionParams: encInc === true || (encObj?.decryptionParams ?? false),
    includeEncryptionAccessControlConditions:
      encInc === true || (encObj?.accessControlConditions ?? false),

    // File — top-level + per-sub-field toggles (name is always included, no toggle needed)
    includeFile: isFileIncluded,
    includeFileType: fileInc === true || (fileObj?.type ?? false),
    includeFileSize: fileInc === true || (fileObj?.size ?? false),
    includeFileLastModified: fileInc === true || (fileObj?.lastModified ?? false),
    includeFileHash: fileInc === true || (fileObj?.hash ?? false),

    // Chunks — top-level + per-sub-field toggles
    includeChunks: isChunksIncluded,
    includeChunksCids: chunksInc === true || (chunksObj?.cids ?? false),
    includeChunksIv: chunksInc === true || (chunksObj?.iv ?? false),
    includeChunksTotalSize: chunksInc === true || (chunksObj?.totalSize ?? false),

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
// Subscription config builder
// ---------------------------------------------------------------------------

/** Raw subscription row type extracted from codegen. */
type RawEncryptedAssetSubscriptionRow =
  EncryptedAssetSubscriptionSubscription['lsp29_encrypted_asset'][number];

/** Build subscription config for useSubscription. */
export function buildEncryptedAssetSubscriptionConfig(params: {
  filter?: EncryptedAssetFilter;
  sort?: EncryptedAssetSort;
  limit?: number;
  include?: EncryptedAssetInclude;
}) {
  const where = buildEncryptedAssetWhere(params.filter);
  const orderBy = buildEncryptedAssetOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildEncryptedAssetIncludeVars(params.include);

  return {
    document: EncryptedAssetSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: EncryptedAssetSubscriptionSubscription) => result.lsp29_encrypted_asset,
    parser: (raw: RawEncryptedAssetSubscriptionRow[]) =>
      params.include ? parseEncryptedAssets(raw, params.include) : parseEncryptedAssets(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

export interface FetchEncryptedAssetsResult<P = EncryptedAsset> {
  encryptedAssets: P[];
  totalCount: number;
}

/** Fetch a paginated list of LSP29 encrypted asset records. */
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
  const orderBy = buildEncryptedAssetOrderBy(params.sort) ?? buildBlockOrderSort('desc');
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
