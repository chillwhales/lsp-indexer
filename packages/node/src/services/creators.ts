import type {
  Creator,
  CreatorFilter,
  CreatorInclude,
  CreatorResult,
  CreatorSort,
  PartialCreator,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { CreatorSubscriptionDocument, GetCreatorsDocument } from '../documents/creators';
import type {
  CreatorSubscriptionSubscription,
  Lsp4_Creator_Bool_Exp,
  Lsp4_Creator_Order_By,
} from '../graphql/graphql';
import { parseCreators } from '../parsers/creators';
import { buildDigitalAssetIncludeVars } from './digital-assets';
import { buildProfileIncludeVars } from './profiles';
import { escapeLike, hasActiveIncludes, normalizeTimestamp, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate CreatorFilter to a Hasura _bool_exp. */
export function buildCreatorWhere(filter?: CreatorFilter): Lsp4_Creator_Bool_Exp {
  if (!filter) return {};

  const conditions: Lsp4_Creator_Bool_Exp[] = [];

  if (filter.creatorAddress) {
    conditions.push({
      creator_address: { _ilike: `%${escapeLike(filter.creatorAddress)}%` },
    });
  }

  if (filter.digitalAssetAddress) {
    conditions.push({
      address: { _ilike: `%${escapeLike(filter.digitalAssetAddress)}%` },
    });
  }

  if (filter.interfaceId) {
    conditions.push({
      interface_id: { _ilike: `%${escapeLike(filter.interfaceId)}%` },
    });
  }

  if (filter.creatorName) {
    conditions.push({
      creatorProfile: {
        lsp3Profile: {
          name: { value: { _ilike: `%${escapeLike(filter.creatorName)}%` } },
        },
      },
    });
  }

  if (filter.digitalAssetName) {
    conditions.push({
      digitalAsset: {
        lsp4TokenName: {
          value: { _ilike: `%${escapeLike(filter.digitalAssetName)}%` },
        },
      },
    });
  }

  if (filter.timestampFrom != null) {
    conditions.push({
      timestamp: { _gte: normalizeTimestamp(filter.timestampFrom) },
    });
  }

  if (filter.timestampTo != null) {
    conditions.push({
      timestamp: { _lte: normalizeTimestamp(filter.timestampTo) },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/** Translate CreatorSort to a Hasura order_by. */
function buildCreatorOrderBy(sort?: CreatorSort): Lsp4_Creator_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'timestamp':
      return [{ timestamp: dir }];
    case 'creatorAddress':
      return [{ creator_address: dir }];
    case 'digitalAssetAddress':
      return [{ address: dir }];
    case 'arrayIndex':
      return [{ array_index: dir }];
    case 'creatorName':
      return [
        {
          creatorProfile: {
            lsp3Profile: {
              name: { value: orderDir(sort.direction, sort.nulls ?? 'last') },
            },
          },
        },
      ];
    case 'digitalAssetName':
      return [
        {
          digitalAsset: {
            lsp4TokenName: {
              value: orderDir(sort.direction, sort.nulls ?? 'last'),
            },
          },
        },
      ];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
export function buildCreatorIncludeVars(include?: CreatorInclude): Record<string, boolean> {
  if (!include) return {};

  const activeCreatorProfile = hasActiveIncludes(include.creatorProfile);
  const activeDigitalAsset = hasActiveIncludes(include.digitalAsset);

  const vars: Record<string, boolean> = {
    includeArrayIndex: include.arrayIndex ?? false,
    includeInterfaceId: include.interfaceId ?? false,
    includeTimestamp: include.timestamp ?? false,
    includeCreatorProfile: activeCreatorProfile,
    includeDigitalAsset: activeDigitalAsset,
  };

  // Creator profile sub-includes: reuse profile include builder with "CreatorProfile" prefix
  if (activeCreatorProfile) {
    const profileVars = buildProfileIncludeVars(include.creatorProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      vars[key.replace('includeProfile', 'includeCreatorProfile')] = val;
    }
  }

  // Digital asset sub-includes: reuse DA include builder with "DigitalAsset" prefix
  if (activeDigitalAsset) {
    const daVars = buildDigitalAssetIncludeVars(include.digitalAsset);
    for (const [key, val] of Object.entries(daVars)) {
      vars[key.replace('include', 'includeDigitalAsset')] = val;
    }
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

type RawCreatorSubscriptionRow = CreatorSubscriptionSubscription['lsp4_creator'][number];

/** Build subscription config for useSubscription. */
export function buildCreatorSubscriptionConfig(params: {
  filter?: CreatorFilter;
  sort?: CreatorSort;
  limit?: number;
  include?: CreatorInclude;
}) {
  const where = buildCreatorWhere(params.filter);
  const orderBy = buildCreatorOrderBy(params.sort);
  const includeVars = buildCreatorIncludeVars(params.include);

  return {
    document: CreatorSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: CreatorSubscriptionSubscription) => result.lsp4_creator,
    parser: (raw: RawCreatorSubscriptionRow[]) =>
      params.include ? parseCreators(raw, params.include) : parseCreators(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

export interface FetchCreatorsResult<P = Creator> {
  creators: P[];
  totalCount: number;
}

/** Fetch a paginated list of LSP4 creator records. */
export async function fetchCreators(
  url: string,
  params?: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchCreatorsResult>;
export async function fetchCreators<const I extends CreatorInclude>(
  url: string,
  params: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchCreatorsResult<CreatorResult<I>>>;
export async function fetchCreators(
  url: string,
  params: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
    include?: CreatorInclude;
  },
): Promise<FetchCreatorsResult<PartialCreator>>;
export async function fetchCreators(
  url: string,
  params: {
    filter?: CreatorFilter;
    sort?: CreatorSort;
    limit?: number;
    offset?: number;
    include?: CreatorInclude;
  } = {},
): Promise<FetchCreatorsResult<PartialCreator>> {
  const where = buildCreatorWhere(params.filter);
  const orderBy = buildCreatorOrderBy(params.sort);
  const includeVars = buildCreatorIncludeVars(params.include);

  const result = await execute(url, GetCreatorsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      creators: parseCreators(result.lsp4_creator, params.include),
      totalCount: result.lsp4_creator_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    creators: parseCreators(result.lsp4_creator),
    totalCount: result.lsp4_creator_aggregate?.aggregate?.count ?? 0,
  };
}
