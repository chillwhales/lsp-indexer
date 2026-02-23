'use client';

import { Hash, Infinity, UserCheck, Users } from 'lucide-react';
import React, { useState } from 'react';

import {
  useFollowCount as useFollowCountNext,
  useFollows as useFollowsNext,
  useInfiniteFollows as useInfiniteFollowsNext,
  useIsFollowing as useIsFollowingNext,
} from '@lsp-indexer/next';
import {
  useFollowCount as useFollowCountReact,
  useFollows as useFollowsReact,
  useInfiniteFollows as useInfiniteFollowsReact,
  useIsFollowing as useIsFollowingReact,
} from '@lsp-indexer/react';
import type {
  FollowerFilter,
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
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'followerAddress', label: 'Follower Address' },
  { value: 'followedAddress', label: 'Followed Address' },
  { value: 'followerName', label: 'Follower Name' },
  { value: 'followedName', label: 'Followed Name' },
];

// ---------------------------------------------------------------------------
// Hook resolution by mode
// ---------------------------------------------------------------------------

/** Canonical hooks type — resolves to React overload signatures (Next has identical shapes) */
type FollowerHooks = {
  useFollows: typeof useFollowsReact;
  useInfiniteFollows: typeof useInfiniteFollowsReact;
  useFollowCount: typeof useFollowCountReact;
  useIsFollowing: typeof useIsFollowingReact;
};

function useFollowerHooks(mode: HookMode): FollowerHooks {
  if (mode === 'server') {
    return {
      useFollows: useFollowsNext,
      useInfiniteFollows: useInfiniteFollowsNext,
      useFollowCount: useFollowCountNext,
      useIsFollowing: useIsFollowingNext,
    };
  }
  return {
    useFollows: useFollowsReact,
    useInfiniteFollows: useInfiniteFollowsReact,
    useFollowCount: useFollowCountReact,
    useIsFollowing: useIsFollowingReact,
  };
}

// ---------------------------------------------------------------------------
// Build filter from debounced values
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared list state for list/infinite tabs
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
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
// Tab 1: Follows — paginated list of follow relationships
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tab 2: Infinite Follows
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tab 3: Count — simplified, just address → followerCount + followingCount
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
// Tab 4: Is Following — two address inputs → boolean result
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
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollows</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowCount</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useIsFollowing</code> hooks against
          live Hasura data (QUERY-05).
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
          label: 'Infinite Follows',
          icon: <Infinity className="size-4" />,
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
      ]}
    />
  );
}
