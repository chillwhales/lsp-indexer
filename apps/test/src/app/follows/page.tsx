'use client';

import { Hash, Heart, Infinity, UserCheck, Users } from 'lucide-react';
import React, { useState } from 'react';

import {
  useFollowCount as useFollowCountNext,
  useFollowers as useFollowersNext,
  useFollowing as useFollowingNext,
  useInfiniteFollowers as useInfiniteFollowersNext,
  useInfiniteFollowing as useInfiniteFollowingNext,
  useIsFollowing as useIsFollowingNext,
} from '@lsp-indexer/next';
import {
  useFollowCount as useFollowCountReact,
  useFollowers as useFollowersReact,
  useFollowing as useFollowingReact,
  useInfiniteFollowers as useInfiniteFollowersReact,
  useInfiniteFollowing as useInfiniteFollowingReact,
  useIsFollowing as useIsFollowingReact,
} from '@lsp-indexer/react';
import type {
  FollowerFilter,
  FollowerInclude,
  FollowerSort,
  FollowerSortField,
  SortDirection,
  SortNulls,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import { FollowerCard } from '@/components/follower-card';
import type { FilterFieldConfig, HookMode, SortOption } from '@/components/playground';
import {
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

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

const FILTERS: FilterFieldConfig[] = [
  {
    key: 'followerAddress',
    label: 'Follower Address',
    placeholder: '0x... (follower)',
    mono: true,
  },
  {
    key: 'followedAddress',
    label: 'Followed Address',
    placeholder: '0x... (followed)',
    mono: true,
  },
  { key: 'followerName', label: 'Follower Name', placeholder: 'Search follower name...' },
  { key: 'followedName', label: 'Followed Name', placeholder: 'Search followed name...' },
  { key: 'timestampFrom', label: 'From Date', placeholder: 'ISO date (e.g. 2024-01-01)' },
  { key: 'timestampTo', label: 'To Date', placeholder: 'ISO date (e.g. 2025-01-01)' },
];

const SORT_OPTIONS: SortOption[] = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'followerAddress', label: 'Follower Address' },
  { value: 'followedAddress', label: 'Followed Address' },
  { value: 'followerName', label: 'Follower Name' },
  { value: 'followedName', label: 'Followed Name' },
];

// ---------------------------------------------------------------------------
// Hook resolution by mode
// ---------------------------------------------------------------------------

function useFollowerHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useFollowers: useFollowersNext,
      useInfiniteFollowers: useInfiniteFollowersNext,
      useFollowing: useFollowingNext,
      useInfiniteFollowing: useInfiniteFollowingNext,
      useFollowCount: useFollowCountNext,
      useIsFollowing: useIsFollowingNext,
    };
  }
  return {
    useFollowers: useFollowersReact,
    useInfiniteFollowers: useInfiniteFollowersReact,
    useFollowing: useFollowingReact,
    useInfiniteFollowing: useInfiniteFollowingReact,
    useFollowCount: useFollowCountReact,
    useIsFollowing: useIsFollowingReact,
  };
}

// ---------------------------------------------------------------------------
// Build filter from debounced values
// ---------------------------------------------------------------------------

function buildFilter(debouncedValues: Record<string, string>): FollowerFilter | undefined {
  const f: FollowerFilter = {};
  if (debouncedValues.followerAddress) f.followerAddress = debouncedValues.followerAddress;
  if (debouncedValues.followedAddress) f.followedAddress = debouncedValues.followedAddress;
  if (debouncedValues.followerName) f.followerName = debouncedValues.followerName;
  if (debouncedValues.followedName) f.followedName = debouncedValues.followedName;
  if (debouncedValues.timestampFrom) f.timestampFrom = debouncedValues.timestampFrom;
  if (debouncedValues.timestampTo) f.timestampTo = debouncedValues.timestampTo;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared list state for list/infinite tabs
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(FILTERS);
  const [sortField, setSortField] = useState<FollowerSortField>('timestamp');
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
  }) as FollowerInclude | undefined;

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

// ---------------------------------------------------------------------------
// Sub-include sections (shared between list tabs)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tab 1: Followers — "who follows this address?"
// ---------------------------------------------------------------------------

function FollowersTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowers } = useFollowerHooks(mode);
  const [address, setAddress] = useState('');
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { followers, totalCount, isLoading, error, isFetching } = useFollowers({
    address,
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="followers-address">Address (who is being followed)</Label>
        <Input
          id="followers-address"
          placeholder="0x... (address to find followers for)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
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
      />
      <IncludeSections {...state} />
      <ResultsList
        items={followers}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(f, i) => (
          <FollowerCard follower={f as unknown as Record<string, unknown>} index={i} />
        )}
        getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
        label="followers"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Infinite Followers
// ---------------------------------------------------------------------------

function InfiniteFollowersTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteFollowers } = useFollowerHooks(mode);
  const [address, setAddress] = useState('');
  const state = useListState();

  const {
    followers,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteFollowers({
    address,
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="inf-followers-address">Address (who is being followed)</Label>
        <Input
          id="inf-followers-address"
          placeholder="0x... (address to find followers for)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
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
      />
      <IncludeSections {...state} />
      <ResultsList
        items={followers}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(f, i) => (
          <FollowerCard follower={f as unknown as Record<string, unknown>} index={i} />
        )}
        getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
        label="followers"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Following — "who does this address follow?"
// ---------------------------------------------------------------------------

function FollowingTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowing } = useFollowerHooks(mode);
  const [address, setAddress] = useState('');
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { following, totalCount, isLoading, error, isFetching } = useFollowing({
    address,
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="following-address">Address (who is following)</Label>
        <Input
          id="following-address"
          placeholder="0x... (address to find following for)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
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
      />
      <IncludeSections {...state} />
      <ResultsList
        items={following}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(f, i) => (
          <FollowerCard follower={f as unknown as Record<string, unknown>} index={i} />
        )}
        getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
        label="following"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Infinite Following
// ---------------------------------------------------------------------------

function InfiniteFollowingTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteFollowing } = useFollowerHooks(mode);
  const [address, setAddress] = useState('');
  const state = useListState();

  const {
    following,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteFollowing({
    address,
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="inf-following-address">Address (who is following)</Label>
        <Input
          id="inf-following-address"
          placeholder="0x... (address to find following for)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
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
      />
      <IncludeSections {...state} />
      <ResultsList
        items={following}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(f, i) => (
          <FollowerCard follower={f as unknown as Record<string, unknown>} index={i} />
        )}
        getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
        label="following"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5: Count — simplified, just address → followerCount + followingCount
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tab 6: Is Following — two address inputs → boolean result
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FollowsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Follows"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowers</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowing</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowCount</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useIsFollowing</code> hooks against
          live Hasura data (QUERY-05).
        </>
      }
      tabs={[
        {
          value: 'followers',
          label: 'Followers',
          icon: <Users className="size-4" />,
          render: (mode) => <FollowersTab mode={mode} />,
        },
        {
          value: 'infinite-followers',
          label: 'Infinite Followers',
          icon: <Infinity className="size-4" />,
          render: (mode) => <InfiniteFollowersTab mode={mode} />,
        },
        {
          value: 'following',
          label: 'Following',
          icon: <Heart className="size-4" />,
          render: (mode) => <FollowingTab mode={mode} />,
        },
        {
          value: 'infinite-following',
          label: 'Infinite Following',
          icon: <Infinity className="size-4" />,
          render: (mode) => <InfiniteFollowingTab mode={mode} />,
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
      ]}
    />
  );
}
