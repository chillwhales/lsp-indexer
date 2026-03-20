'use client';

/** Mutual Follows playground — mutual follows, mutual followers, and followed-by-my-follows queries. */
import { InfinityIcon, Users, UsersRound } from 'lucide-react';
import React, { useState } from 'react';

import {
  useFollowedByMyFollows as useFollowedByMyFollowsNext,
  useInfiniteFollowedByMyFollows as useInfiniteFollowedByMyFollowsNext,
  useInfiniteMutualFollowers as useInfiniteMutualFollowersNext,
  useInfiniteMutualFollows as useInfiniteMutualFollowsNext,
  useMutualFollowers as useMutualFollowersNext,
  useMutualFollows as useMutualFollowsNext,
} from '@lsp-indexer/next';
import {
  useFollowedByMyFollows as useFollowedByMyFollowsReact,
  useInfiniteFollowedByMyFollows as useInfiniteFollowedByMyFollowsReact,
  useInfiniteMutualFollowers as useInfiniteMutualFollowersReact,
  useInfiniteMutualFollows as useInfiniteMutualFollowsReact,
  useMutualFollowers as useMutualFollowersReact,
  useMutualFollows as useMutualFollowsReact,
} from '@lsp-indexer/react';
import {
  type ProfileInclude,
  type ProfileSort,
  type ProfileSortField,
  type SortDirection,
  type SortNulls,
} from '@lsp-indexer/types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ProfileCard } from '@/components/profile-card';
import {
  type HookMode,
  type SortOption,
  buildNestedInclude,
  ErrorAlert,
  IncludeToggles,
  PlaygroundPageLayout,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  useIncludeToggles,
} from '@/components/playground';

// ---------------------------------------------------------------------------
// Shared sort options (these hooks return profiles)
// ---------------------------------------------------------------------------

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Name' },
  { value: 'followerCount', label: 'Followers' },
  { value: 'followingCount', label: 'Following' },
];

// ---------------------------------------------------------------------------
// Hook selector — resolves React vs Next.js hooks per mode toggle
// ---------------------------------------------------------------------------

type MutualFollowHooks = {
  useMutualFollows: typeof useMutualFollowsReact;
  useInfiniteMutualFollows: typeof useInfiniteMutualFollowsReact;
  useMutualFollowers: typeof useMutualFollowersReact;
  useInfiniteMutualFollowers: typeof useInfiniteMutualFollowersReact;
  useFollowedByMyFollows: typeof useFollowedByMyFollowsReact;
  useInfiniteFollowedByMyFollows: typeof useInfiniteFollowedByMyFollowsReact;
};

function useMutualFollowHooks(mode: HookMode): MutualFollowHooks {
  if (mode === 'server') {
    return {
      useMutualFollows: useMutualFollowsNext,
      useInfiniteMutualFollows: useInfiniteMutualFollowsNext,
      useMutualFollowers: useMutualFollowersNext,
      useInfiniteMutualFollowers: useInfiniteMutualFollowersNext,
      useFollowedByMyFollows: useFollowedByMyFollowsNext,
      useInfiniteFollowedByMyFollows: useInfiniteFollowedByMyFollowsNext,
    };
  }
  return {
    useMutualFollows: useMutualFollowsReact,
    useInfiniteMutualFollows: useInfiniteMutualFollowsReact,
    useMutualFollowers: useMutualFollowersReact,
    useInfiniteMutualFollowers: useInfiniteMutualFollowersReact,
    useFollowedByMyFollows: useFollowedByMyFollowsReact,
    useInfiniteFollowedByMyFollows: useInfiniteFollowedByMyFollowsReact,
  };
}

// ---------------------------------------------------------------------------
// Shared state hook — include toggles + sort controls for profile results
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared controls component
// ---------------------------------------------------------------------------

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
        options={SORT_OPTIONS}
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

// ---------------------------------------------------------------------------
// Address pair inputs — addressA/addressB
// ---------------------------------------------------------------------------

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
// Tab: Mutual Follows (base)
// ---------------------------------------------------------------------------

function MutualFollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useMutualFollows } = useMutualFollowHooks(mode);
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
        renderItem={(p, i) => <ProfileCard profile={p} />}
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
  const { useInfiniteMutualFollows } = useMutualFollowHooks(mode);
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
        renderItem={(p, i) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="mutual follows"
        hasActiveFilter={Boolean(addressA) || Boolean(addressB)}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Mutual Followers (base)
// ---------------------------------------------------------------------------

function MutualFollowersTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useMutualFollowers } = useMutualFollowHooks(mode);
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
        renderItem={(p, i) => <ProfileCard profile={p} />}
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
  const { useInfiniteMutualFollowers } = useMutualFollowHooks(mode);
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
        renderItem={(p, i) => <ProfileCard profile={p} />}
        getKey={(p) => p.address}
        label="mutual followers"
        hasActiveFilter={Boolean(addressA) || Boolean(addressB)}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Followed By My Follows (base)
// ---------------------------------------------------------------------------

function FollowedByMyFollowsTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowedByMyFollows } = useMutualFollowHooks(mode);
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
        renderItem={(p, i) => <ProfileCard profile={p} />}
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
  const { useInfiniteFollowedByMyFollows } = useMutualFollowHooks(mode);
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
        renderItem={(p, i) => <ProfileCard profile={p} />}
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

export default function MutualFollowsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Mutual Follows"
      description={
        <>
          Exercise{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useMutualFollows</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useMutualFollowers</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowedByMyFollows</code>, and
          their infinite variants against live Hasura data.
        </>
      }
      tabs={[
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
