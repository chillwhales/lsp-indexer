import type {
  Profile,
  ProfileFilter,
  ProfileInclude,
  SubscriptionConfig,
} from '@lsp-indexer/types';

import { ProfileSubscriptionDocument } from '../documents/profiles';
import { type RawProfile, parseProfiles } from '../parsers/profiles';
import { buildIncludeVars, buildProfileWhere } from '../services/profiles';
import { createSubscriptionConfig } from './create-subscription-config';

/**
 * Parameters for building a profile subscription config.
 *
 * These are the domain-specific inputs — the same filter/include/limit
 * shape used by `useProfiles` and `useInfiniteProfiles`.
 */
export interface ProfileSubscriptionParams {
  /** Filter criteria to narrow which profiles to subscribe to */
  filter?: ProfileFilter;
  /** Control which nested fields are included in subscription data */
  include?: ProfileInclude;
  /** Maximum number of results per subscription update (default: 10) */
  limit?: number;
}

/** Default number of profiles per subscription payload */
const DEFAULT_SUBSCRIPTION_LIMIT = 10;

/**
 * Build a `SubscriptionConfig<Profile>` from flat domain parameters.
 *
 * Encapsulates all domain knowledge — document, Hasura variable builders,
 * and the raw→clean parser — so that hook factories in React/Next are
 * thin wrappers that only handle framework concerns (enabled, invalidation,
 * callbacks).
 *
 * Internal helpers (`buildIncludeVars`, `buildProfileWhere`) and raw types
 * stay unexported from the package barrel; only this factory is public.
 *
 * @param params - Filter, include, and limit options (mirrors query hooks)
 * @returns A fully typed `SubscriptionConfig<Profile>` ready for `useSubscription`
 *
 * @example
 * ```ts
 * const config = createProfileSubscriptionConfig({ filter: { name: 'alice' }, limit: 5 });
 * const result = useSubscription(config, { enabled: true });
 * ```
 */
export function createProfileSubscriptionConfig(
  params: ProfileSubscriptionParams = {},
): SubscriptionConfig<Profile> {
  const { filter, include, limit = DEFAULT_SUBSCRIPTION_LIMIT } = params;

  const where = buildProfileWhere(filter);
  const includeVars = buildIncludeVars(include);

  return createSubscriptionConfig<Profile, RawProfile>({
    document: ProfileSubscriptionDocument,
    dataKey: 'universal_profile',
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: undefined,
      limit,
      ...includeVars,
    },
    parser: parseProfiles,
  });
}
