'use client';

/** Follows playground — LSP26 social graph: list, infinite, count, is-following, and subscriptions. */
import {
  Hash,
  InfinityIcon,
  Radio,
  UserCheck,
  Users,
  UsersRound,
  Wifi,
  WifiOff,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  useFollowCount as useFollowCountNext,
  useFollowedByMyFollows as useFollowedByMyFollowsNext,
  useFollows as useFollowsNext,
  useInfiniteFollowedByMyFollows as useInfiniteFollowedByMyFollowsNext,
  useInfiniteFollows as useInfiniteFollowsNext,
  useInfiniteMutualFollowers as useInfiniteMutualFollowersNext,
  useInfiniteMutualFollows as useInfiniteMutualFollowsNext,
  useIsFollowingBatch as useIsFollowingBatchNext,
  useIsFollowing as useIsFollowingNext,
  useMutualFollowers as useMutualFollowersNext,
  useMutualFollows as useMutualFollowsNext,
} from '@lsp-indexer/next';
import {
  useFollowCount as useFollowCountReact,
  useFollowedByMyFollows as useFollowedByMyFollowsReact,
  useFollowerSubscription,
  useFollows as useFollowsReact,
  useInfiniteFollowedByMyFollows as useInfiniteFollowedByMyFollowsReact,
  useInfiniteFollows as useInfiniteFollowsReact,
  useInfiniteMutualFollowers as useInfiniteMutualFollowersReact,
  useInfiniteMutualFollows as useInfiniteMutualFollowsReact,
  useIsFollowingBatch as useIsFollowingBatchReact,
  useIsFollowing as useIsFollowingReact,
  useMutualFollowers as useMutualFollowersReact,
  useMutualFollows as useMutualFollowsReact,
} from '@lsp-indexer/react';
import {
  type FollowerFilter,
  type FollowerSort,
  type FollowerSortField,
  type ProfileInclude,
  type ProfileSort,
  type ProfileSortField,
  type SortDirection,
  type SortNulls,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { FollowerCard } from '@/components/follower-card';
import {
  type FilterFieldConfig,
  type HookMode,
  type SortOption,
  buildNestedInclude,
  ErrorAlert,
  FilterFieldsRow,
  FOLLOWER_INCLUDE_FIELDS,
  IncludeToggles,
  PlaygroundPageLayout,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  SubIncludeSection,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';

/** All filter configs — used by useFilterFields for state management */
const ALL_FILTERS: FilterFieldConfig[] = [
  {
    key: 'followerAddress',
    label: 'Follower Address',
    placeholder: '0x... (follower)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'followedAddress',
    label: 'Followed Address',
    placeholder: '0x... (followed)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'followerName',
    label: 'Follower Name',
    placeholder: 'Search follower name...',
    width: 'w-80',
  },
  {
    key: 'followedName',
    label: 'Followed Name',
    placeholder: 'Search followed name...',
    width: 'w-80',
  },
  {
    key: 'timestampFrom',
    label: 'From',
    placeholder: 'ISO or unix (e.g. 2024-01-01 or 1704067200)',
    width: 'w-80',
  },
  {
    key: 'timestampTo',
    label: 'To',
    placeholder: 'ISO or unix (e.g. 2025-01-01 or 1735689600)',
    width: 'w-80',
  },
];

/** Filter groups rendered as separate rows — addresses, names, dates */
const ADDRESS_FILTERS = ALL_FILTERS.filter((f) => f.key.endsWith('Address'));
const NAME_FILTERS = ALL_FILTERS.filter((f) => f.key.endsWith('Name'));
const DATE_FILTERS = ALL_FILTERS.filter((f) => f.key.startsWith('timestamp'));

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'followerAddress', label: 'Follower Address' },
  { value: 'followedAddress', label: 'Followed Address' },
  { value: 'followerName', label: 'Follower Name' },
  { value: 'followedName', label: 'Followed Name' },
];

/** Canonical hooks type — resolves to React overload signatures (Next has identical shapes) */
type FollowerHooks = {
  useFollows: typeof useFollowsReact;
  useInfiniteFollows: typeof useInfiniteFollowsReact;
  useFollowCount: typeof useFollowCountReact;
  useIsFollowing: typeof useIsFollowingReact;
  useIsFollowingBatch: typeof useIsFollowingBatchReact;
  useFollowerSubscription: typeof useFollowerSubscription;
  useMutualFollows: typeof useMutualFollowsReact;
  useInfiniteMutualFollows: typeof useInfiniteMutualFollowsReact;
  useMutualFollowers: typeof useMutualFollowersReact;
  useInfiniteMutualFollowers: typeof useInfiniteMutualFollowersReact;
  useFollowedByMyFollows: typeof useFollowedByMyFollowsReact;
  useInfiniteFollowedByMyFollows: typeof useInfiniteFollowedByMyFollowsReact;
};

function useFollowerHooks(mode: HookMode): FollowerHooks {
  if (mode === 'server') {
    return {
      useFollows: useFollowsNext,
      useInfiniteFollows: useInfiniteFollowsNext,
      useFollowCount: useFollowCountNext,
      useIsFollowing: useIsFollowingNext,
      useIsFollowingBatch: useIsFollowingBatchNext,
      useFollowerSubscription,
      useMutualFollows: useMutualFollowsNext,
      useInfiniteMutualFollows: useInfiniteMutualFollowsNext,
      useMutualFollowers: useMutualFollowersNext,
      useInfiniteMutualFollowers: useInfiniteMutualFollowersNext,
      useFollowedByMyFollows: useFollowedByMyFollowsNext,
      useInfiniteFollowedByMyFollows: useInfiniteFollowedByMyFollowsNext,
    };
  }
  return {
    useFollows: useFollowsReact,
    useInfiniteFollows: useInfiniteFollowsReact,
    useFollowCount: useFollowCountReact,
    useIsFollowing: useIsFollowingReact,
    useIsFollowingBatch: useIsFollowingBatchReact,
    useFollowerSubscription,
    useMutualFollows: useMutualFollowsReact,
    useInfiniteMutualFollows: useInfiniteMutualFollowsReact,
    useMutualFollowers: useMutualFollowersReact,
    useInfiniteMutualFollowers: useInfiniteMutualFollowersReact,
    useFollowedByMyFollows: useFollowedByMyFollowsReact,
    useInfiniteFollowedByMyFollows: useInfiniteFollowedByMyFollowsReact,
  };
}

/** Parse a timestamp input — pure digits → unix seconds (number), otherwise ISO string */
function parseTimestamp(value: string): string | number {
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

function buildFilter(debouncedValues: Record<string, string>): FollowerFilter | undefined {
  const f: FollowerFilter = {};
  if (debouncedValues.followerAddress) f.followerAddress = debouncedValues.followerAddress;
  if (debouncedValues.followedAddress) f.followedAddress = debouncedValues.followedAddress;
  if (debouncedValues.followerName) f.followerName = debouncedValues.followerName;
  if (debouncedValues.followedName) f.followedName = debouncedValues.followedName;
  if (debouncedValues.timestampFrom)
    f.timestampFrom = parseTimestamp(debouncedValues.timestampFrom);
  if (debouncedValues.timestampTo) f.timestampTo = parseTimestamp(debouncedValues.timestampTo);
  return Object.keys(f).length > 0 ? f : undefined;
}

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<FollowerSortField>('newest');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } =
    useIncludeToggles(FOLLOWER_INCLUDE_FIELDS);
  const followerProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const followedProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: FollowerSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNestedInclude(includeValues, {
    followerProfile: followerProfile.value,
    followedProfile: followedProfile.value,
  });

  return {
    values,
    setFieldValue,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    sortNulls,
    setSortNulls,
    filter,
    sort,
    hasActiveFilter,
    includeValues,
    toggleInclude,
    include,
    followerProfile,
    followedProfile,
  };
}

function IncludeSections({
  includeValues,
  toggleInclude,
  followerProfile,
  followedProfile,
}: ReturnType<typeof useListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={FOLLOWER_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Follower Profile"
        subtitle="Follower profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={followerProfile}
      />
      <SubIncludeSection
        label="Followed Profile"
        subtitle="Followed profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={followedProfile}
      />
    </>
  );
}

function FollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollows } = useFollowerHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { follows, totalCount, isLoading, error, isFetching } = useFollows({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={ADDRESS_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={NAME_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={DATE_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as FollowerSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <IncludeSections {...state} />
      <ResultsList
        items={follows}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(f, i) => <FollowerCard follower={f} index={i} />}
        getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
        label="follows"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

function InfiniteFollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteFollows } = useFollowerHooks(mode);
  const state = useListState();

  const { follows, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteFollows({
      filter: state.filter,
      sort: state.sort,
      pageSize: 10,
      include: state.include,
    });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={ADDRESS_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={NAME_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={DATE_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as FollowerSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <IncludeSections {...state} />
      <ResultsList
        items={follows}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(f, i) => <FollowerCard follower={f} index={i} />}
        getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
        label="follows"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

function CountTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowCount } = useFollowerHooks(mode);
  const [address, setAddress] = useState('');

  const { followerCount, followingCount, isLoading, error } = useFollowCount({ address });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="count-address">Address</Label>
        <Input
          id="count-address"
          placeholder="0x... (address to get follow counts for)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      {error && <ErrorAlert error={error} />}

      {isLoading && address && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
        </Card>
      )}

      {!isLoading && address && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Follow Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{followerCount}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{followingCount}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IsFollowingTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useIsFollowing } = useFollowerHooks(mode);
  const [followerAddress, setFollowerAddress] = useState('');
  const [followedAddress, setFollowedAddress] = useState('');

  const { isFollowing, isLoading, error } = useIsFollowing({
    followerAddress,
    followedAddress,
  });

  const hasQuery = Boolean(followerAddress) && Boolean(followedAddress);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="is-following-follower">Follower Address</Label>
        <Input
          id="is-following-follower"
          placeholder="0x... (the address that might be following)"
          value={followerAddress}
          onChange={(e) => setFollowerAddress(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="is-following-followed">Followed Address</Label>
        <Input
          id="is-following-followed"
          placeholder="0x... (the address that might be followed)"
          value={followedAddress}
          onChange={(e) => setFollowedAddress(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      {error && <ErrorAlert error={error} />}

      {isLoading && hasQuery && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
        </Card>
      )}

      {!isLoading && hasQuery && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={isFollowing ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                {isFollowing ? 'YES' : 'NO'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {isFollowing
                  ? 'This address is following the target.'
                  : 'This address is NOT following the target.'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BatchIsFollowingTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useIsFollowingBatch } = useFollowerHooks(mode);
  const [input, setInput] = useState('');
  const [pairs, setPairs] = useState<Array<{ followerAddress: string; followedAddress: string }>>(
    [],
  );

  function parsePairs(): void {
    const lines = input
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = lines
      .map((line) => {
        const [follower, followed] = line.split(':').map((s) => s.trim());
        if (follower && followed) return { followerAddress: follower, followedAddress: followed };
        return null;
      })
      .filter(Boolean) as Array<{ followerAddress: string; followedAddress: string }>;
    setPairs(parsed);
  }

  const { results, isLoading, error } = useIsFollowingBatch({ pairs });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="batch-pairs">
          Address Pairs{' '}
          <span className="text-muted-foreground font-normal">
            (one per line, format: followerAddress:followedAddress)
          </span>
        </Label>
        <Textarea
          id="batch-pairs"
          className="min-h-[120px] font-mono"
          placeholder={`0xFollower1:0xFollowed1\n0xFollower2:0xFollowed2\n0xFollower3:0xFollowed3`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={parsePairs}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
      >
        Check Pairs ({input.split('\n').filter((l) => l.trim()).length})
      </button>

      {error && <ErrorAlert error={error} />}

      {isLoading && pairs.length > 0 && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
        </Card>
      )}

      {!isLoading && pairs.length > 0 && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Results ({results.size} pair{results.size !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pairs.map((pair) => {
                const key = `${pair.followerAddress.toLowerCase()}:${pair.followedAddress.toLowerCase()}`;
                const isFollowing = results.get(key) ?? false;
                return (
                  <div key={key} className="flex items-center gap-3 text-sm font-mono">
                    <Badge
                      variant={isFollowing ? 'default' : 'secondary'}
                      className="w-8 justify-center"
                    >
                      {isFollowing ? '✓' : '✗'}
                    </Badge>
                    <span className="truncate">
                      {pair.followerAddress} → {pair.followedAddress}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {pairs.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Enter address pairs above and click &quot;Check Pairs&quot; to see results.
        </p>
      )}
    </div>
  );
}

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowerSubscription } = useFollowerHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useFollowerSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const followers = data ?? [];
  const isLoading = data === null && isSubscribed;
  const normalizedError =
    error instanceof Error
      ? error
      : error != null
        ? new Error(typeof error === 'string' ? error : 'Unknown error')
        : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
          {isConnected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
        <Badge variant={isSubscribed ? 'default' : 'secondary'}>
          {isSubscribed ? 'Subscribed' : 'Idle'}
        </Badge>
        <div className="ml-auto flex items-center space-x-2">
          <Switch id="sub-invalidate" checked={invalidate} onCheckedChange={setInvalidate} />
          <Label htmlFor="sub-invalidate">Invalidate Cache</Label>
        </div>
      </div>

      <div className="space-y-2">
        <FilterFieldsRow
          configs={ADDRESS_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={NAME_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={DATE_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as FollowerSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <IncludeSections {...state} />
      <ResultsList
        items={followers}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(f, i) => <FollowerCard follower={f} index={i} />}
        getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
        label="follows"
        totalCount={followers.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mutual follow shared state + controls (profile results, not follower results)
// ---------------------------------------------------------------------------

const MUTUAL_SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Name' },
  { value: 'followerCount', label: 'Followers' },
  { value: 'followingCount', label: 'Following' },
];

function useProfileListState() {
  const [sortField, setSortField] = useState<ProfileSortField>('newest');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } =
    useIncludeToggles(PROFILE_INCLUDE_FIELDS);

  const sort: ProfileSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const include = buildNestedInclude(includeValues, {}) as ProfileInclude | undefined;

  return {
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    sortNulls,
    setSortNulls,
    sort,
    includeValues,
    toggleInclude,
    include,
  };
}

function ProfileControls({
  state,
  limit,
  onLimitChange,
}: {
  state: ReturnType<typeof useProfileListState>;
  limit?: number;
  onLimitChange?: (v: number) => void;
}): React.ReactNode {
  return (
    <>
      <SortControls
        options={MUTUAL_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as ProfileSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={onLimitChange}
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <IncludeToggles
        configs={PROFILE_INCLUDE_FIELDS}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
    </>
  );
}

function AddressPairInputs({
  labelA,
  labelB,
  placeholderA,
  placeholderB,
  valueA,
  valueB,
  onChangeA,
  onChangeB,
}: {
  labelA: string;
  labelB: string;
  placeholderA: string;
  placeholderB: string;
  valueA: string;
  valueB: string;
  onChangeA: (v: string) => void;
  onChangeB: (v: string) => void;
}): React.ReactNode {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{labelA}</Label>
        <Input
          placeholder={placeholderA}
          value={valueA}
          onChange={(e) => onChangeA(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label>{labelB}</Label>
        <Input
          placeholder={placeholderB}
          value={valueB}
          onChange={(e) => onChangeB(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Mutual Follows
// ---------------------------------------------------------------------------

function MutualFollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useMutualFollows } = useFollowerHooks(mode);
  const state = useProfileListState();
  const [addressA, setAddressA] = useState('');
  const [addressB, setAddressB] = useState('');
  const [limit, setLimit] = useState(10);

  const { profiles, totalCount, isLoading, error, isFetching } = useMutualFollows({
    addressA,
    addressB,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <AddressPairInputs
        labelA="Address A"
        labelB="Address B"
        placeholderA="0x... (first address)"
        placeholderB="0x... (second address)"
        valueA={addressA}
        valueB={addressB}
        onChangeA={setAddressA}
        onChangeB={setAddressB}
      />
      <ProfileControls state={state} limit={limit} onLimitChange={setLimit} />
      {error && <ErrorAlert error={error} />}
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(p) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="mutual follows"
        totalCount={totalCount}
        hasActiveFilter={Boolean(addressA) || Boolean(addressB)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Infinite Mutual Follows
// ---------------------------------------------------------------------------

function InfiniteMutualFollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteMutualFollows } = useFollowerHooks(mode);
  const state = useProfileListState();
  const [addressA, setAddressA] = useState('');
  const [addressB, setAddressB] = useState('');

  const { profiles, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteMutualFollows({
      addressA,
      addressB,
      sort: state.sort,
      pageSize: 10,
      include: state.include,
    });

  return (
    <div className="space-y-4">
      <AddressPairInputs
        labelA="Address A"
        labelB="Address B"
        placeholderA="0x... (first address)"
        placeholderB="0x... (second address)"
        valueA={addressA}
        valueB={addressB}
        onChangeA={setAddressA}
        onChangeB={setAddressB}
      />
      <ProfileControls state={state} />
      {error && <ErrorAlert error={error} />}
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(p) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="mutual follows"
        hasActiveFilter={Boolean(addressA) || Boolean(addressB)}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Mutual Followers
// ---------------------------------------------------------------------------

function MutualFollowersTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useMutualFollowers } = useFollowerHooks(mode);
  const state = useProfileListState();
  const [addressA, setAddressA] = useState('');
  const [addressB, setAddressB] = useState('');
  const [limit, setLimit] = useState(10);

  const { profiles, totalCount, isLoading, error, isFetching } = useMutualFollowers({
    addressA,
    addressB,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <AddressPairInputs
        labelA="Address A"
        labelB="Address B"
        placeholderA="0x... (first address)"
        placeholderB="0x... (second address)"
        valueA={addressA}
        valueB={addressB}
        onChangeA={setAddressA}
        onChangeB={setAddressB}
      />
      <ProfileControls state={state} limit={limit} onLimitChange={setLimit} />
      {error && <ErrorAlert error={error} />}
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(p) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="mutual followers"
        totalCount={totalCount}
        hasActiveFilter={Boolean(addressA) || Boolean(addressB)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Infinite Mutual Followers
// ---------------------------------------------------------------------------

function InfiniteMutualFollowersTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteMutualFollowers } = useFollowerHooks(mode);
  const state = useProfileListState();
  const [addressA, setAddressA] = useState('');
  const [addressB, setAddressB] = useState('');

  const { profiles, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteMutualFollowers({
      addressA,
      addressB,
      sort: state.sort,
      pageSize: 10,
      include: state.include,
    });

  return (
    <div className="space-y-4">
      <AddressPairInputs
        labelA="Address A"
        labelB="Address B"
        placeholderA="0x... (first address)"
        placeholderB="0x... (second address)"
        valueA={addressA}
        valueB={addressB}
        onChangeA={setAddressA}
        onChangeB={setAddressB}
      />
      <ProfileControls state={state} />
      {error && <ErrorAlert error={error} />}
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(p) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="mutual followers"
        hasActiveFilter={Boolean(addressA) || Boolean(addressB)}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Followed By My Follows
// ---------------------------------------------------------------------------

function FollowedByMyFollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowedByMyFollows } = useFollowerHooks(mode);
  const state = useProfileListState();
  const [myAddress, setMyAddress] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [limit, setLimit] = useState(10);

  const { profiles, totalCount, isLoading, error, isFetching } = useFollowedByMyFollows({
    myAddress,
    targetAddress,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <AddressPairInputs
        labelA="My Address"
        labelB="Target Address"
        placeholderA="0x... (your address)"
        placeholderB="0x... (target address)"
        valueA={myAddress}
        valueB={targetAddress}
        onChangeA={setMyAddress}
        onChangeB={setTargetAddress}
      />
      <ProfileControls state={state} limit={limit} onLimitChange={setLimit} />
      {error && <ErrorAlert error={error} />}
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(p) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="followed by my follows"
        totalCount={totalCount}
        hasActiveFilter={Boolean(myAddress) || Boolean(targetAddress)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Infinite Followed By My Follows
// ---------------------------------------------------------------------------

function InfiniteFollowedByMyFollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteFollowedByMyFollows } = useFollowerHooks(mode);
  const state = useProfileListState();
  const [myAddress, setMyAddress] = useState('');
  const [targetAddress, setTargetAddress] = useState('');

  const { profiles, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteFollowedByMyFollows({
      myAddress,
      targetAddress,
      sort: state.sort,
      pageSize: 10,
      include: state.include,
    });

  return (
    <div className="space-y-4">
      <AddressPairInputs
        labelA="My Address"
        labelB="Target Address"
        placeholderA="0x... (your address)"
        placeholderB="0x... (target address)"
        valueA={myAddress}
        valueB={targetAddress}
        onChangeA={setMyAddress}
        onChangeB={setTargetAddress}
      />
      <ProfileControls state={state} />
      {error && <ErrorAlert error={error} />}
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(p) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="followed by my follows"
        hasActiveFilter={Boolean(myAddress) || Boolean(targetAddress)}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function FollowsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Follows"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollows</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteFollows</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowCount</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useIsFollowing</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useIsFollowingBatch</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowerSubscription</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useMutualFollows</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useMutualFollowers</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowedByMyFollows</code> hooks
          against live Hasura data.
        </>
      }
      tabs={[
        {
          value: 'follows',
          label: 'Follows',
          icon: <Users className="size-4" />,
          render: (mode) => <FollowsTab mode={mode} />,
        },
        {
          value: 'infinite-follows',
          label: '∞ Follows',
          icon: <InfinityIcon className="size-4" />,
          render: (mode) => <InfiniteFollowsTab mode={mode} />,
        },
        {
          value: 'count',
          label: 'Count',
          icon: <Hash className="size-4" />,
          render: (mode) => <CountTab mode={mode} />,
        },
        {
          value: 'is-following',
          label: 'Is Following',
          icon: <UserCheck className="size-4" />,
          render: (mode) => <IsFollowingTab mode={mode} />,
        },
        {
          value: 'batch-is-following',
          label: 'Batch',
          icon: <UsersRound className="size-4" />,
          render: (mode) => <BatchIsFollowingTab mode={mode} />,
        },
        {
          value: 'subscription',
          label: 'Subscription',
          icon: <Radio className="size-4" />,
          render: (mode) => <SubscriptionTab mode={mode} />,
        },
        {
          value: 'mutual-follows',
          label: 'Mutual Follows',
          icon: <Users className="size-4" />,
          render: (mode) => <MutualFollowsTab mode={mode} />,
        },
        {
          value: 'infinite-mutual-follows',
          label: '∞ Mutual Follows',
          icon: <InfinityIcon className="size-4" />,
          render: (mode) => <InfiniteMutualFollowsTab mode={mode} />,
        },
        {
          value: 'mutual-followers',
          label: 'Mutual Followers',
          icon: <UsersRound className="size-4" />,
          render: (mode) => <MutualFollowersTab mode={mode} />,
        },
        {
          value: 'infinite-mutual-followers',
          label: '∞ Mutual Followers',
          icon: <InfinityIcon className="size-4" />,
          render: (mode) => <InfiniteMutualFollowersTab mode={mode} />,
        },
        {
          value: 'followed-by-my-follows',
          label: 'By My Follows',
          icon: <Users className="size-4" />,
          render: (mode) => <FollowedByMyFollowsTab mode={mode} />,
        },
        {
          value: 'infinite-followed-by-my-follows',
          label: '∞ By My Follows',
          icon: <InfinityIcon className="size-4" />,
          render: (mode) => <InfiniteFollowedByMyFollowsTab mode={mode} />,
        },
      ]}
    />
  );
}
