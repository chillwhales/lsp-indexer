'use client';

/**
 * Profiles Playground — demonstrates @lsp-indexer hook usage for Universal Profiles (LSP3).
 *
 * **Hooks demonstrated:**
 * - `useProfile` / `useProfile` (next) — Single profile lookup by address
 * - `useProfiles` / `useProfiles` (next) — Filtered, sorted, paginated list
 * - `useInfiniteProfiles` / `useInfiniteProfiles` (next) — Infinite scroll with fetchNextPage
 * - `useProfileSubscription` / `useProfileSubscription` (next) — Real-time WebSocket updates
 *
 * **Patterns shown:**
 * - 4-tab layout: Single, List, Infinite, Subscription
 * - Filter fields with debounced search (name, followedBy, following, tokenOwned)
 * - Sort controls with field/direction/nulls configuration (name, followerCount, followingCount)
 * - Include toggles for conditional field inclusion (type narrowing)
 * - Package toggle (react vs next) to compare client-direct vs server-action routing
 * - Preset buttons for quick single-profile lookups
 * - Subscription tab with WebSocket connection status and cache invalidation toggle
 *
 * @see {@link https://github.com/chillwhales/lsp-indexer} for package documentation
 */
import { Loader2, Radio, Search, User, Users, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteProfiles as useInfiniteProfilesNext,
  useProfile as useProfileNext,
  useProfileSubscription as useProfileSubscriptionNext,
  useProfiles as useProfilesNext,
} from '@lsp-indexer/next';
import {
  useInfiniteProfiles as useInfiniteProfilesReact,
  useProfile as useProfileReact,
  useProfileSubscription as useProfileSubscriptionReact,
  useProfiles as useProfilesReact,
} from '@lsp-indexer/react';
import type {
  ProfileFilter,
  ProfileSort,
  ProfileSortField,
  SortDirection,
  SortNulls,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

import type { FilterFieldConfig, HookMode, SortOption } from '@/components/playground';
import {
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  PROFILE_INCLUDE_FIELDS,
  PlaygroundPageLayout,
  PresetButtons,
  ResultsList,
  SortControls,
  useFilterFields,
  useIncludeToggles,
} from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

const FILTERS: FilterFieldConfig[] = [
  { key: 'name', label: 'Name', placeholder: 'Search by name...' },
  { key: 'followedBy', label: 'Followed by', placeholder: '0x... (address)', mono: true },
  { key: 'following', label: 'Following', placeholder: '0x... (address)', mono: true },
  { key: 'tokenOwned', label: 'Owns asset', placeholder: '0x... (token address)', mono: true },
] as const;

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'followerCount', label: 'Followers' },
  { value: 'followingCount', label: 'Following' },
];

const PRESETS = [
  { label: 'chill-labs', address: '0xB6c10458274431189D4D0dA66ce00dc62A215908' },
  { label: 'b00ste', address: '0x00Aa9761286f21437c90AD2f895ef0dcA3484306' },
  { label: 'feindura', address: '0xCDeC110F9c255357E37f46CD2687be1f7E9B02F7' },
] as const;

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useProfile: useProfileNext,
      useProfiles: useProfilesNext,
      useInfiniteProfiles: useInfiniteProfilesNext,
      useProfileSubscription: useProfileSubscriptionNext,
    };
  }
  return {
    useProfile: useProfileReact,
    useProfiles: useProfilesReact,
    useInfiniteProfiles: useInfiniteProfilesReact,
    useProfileSubscription: useProfileSubscriptionReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): ProfileFilter | undefined {
  const f: ProfileFilter = {};
  if (debouncedValues.name) f.name = debouncedValues.name;
  if (debouncedValues.followedBy) f.followedBy = debouncedValues.followedBy;
  if (debouncedValues.following) f.following = debouncedValues.following;
  if (debouncedValues.tokenOwned) f.tokenOwned = { address: debouncedValues.tokenOwned };
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared list state
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(FILTERS);
  const [sortField, setSortField] = useState<ProfileSortField>('followerCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(PROFILE_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: ProfileSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

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
  };
}

// ---------------------------------------------------------------------------
// Tab 1: Single Profile
// ---------------------------------------------------------------------------

function SingleTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useProfile } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(PROFILE_INCLUDE_FIELDS);

  const { profile, isLoading, error, isFetching } = useProfile({ address: queryAddress, include });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryAddress(address);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Enter Universal Profile address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
        <Button type="submit" disabled={!address}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      <PresetButtons
        presets={PRESETS}
        onSelect={(p) => {
          setAddress(p.address);
          setQueryAddress(p.address);
        }}
      />

      <IncludeToggles
        configs={PROFILE_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />

      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
        </Card>
      )}
      {error && <ErrorAlert error={error} />}
      {profile && <ProfileCard profile={profile} isFetching={isFetching} />}
      {queryAddress && !isLoading && !error && !profile && (
        <Alert>
          <User className="h-4 w-4" />
          <AlertTitle>No Profile Found</AlertTitle>
          <AlertDescription>
            No Universal Profile found at address{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Profile List
// ---------------------------------------------------------------------------

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useProfiles } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { profiles, totalCount, isLoading, error, isFetching } = useProfiles({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
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
        onLimitChange={setLimit}
      />
      <IncludeToggles
        configs={PROFILE_INCLUDE_FIELDS}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(profile) => <ProfileCard profile={profile} />}
        getKey={(p) => p.address}
        label="profiles"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Infinite Scroll
// ---------------------------------------------------------------------------

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteProfiles } = useHooks(mode);
  const state = useListState();

  const { profiles, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteProfiles({
      filter: state.filter,
      sort: state.sort,
      pageSize: 10,
      include: state.include,
    });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
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
      />
      <IncludeToggles
        configs={PROFILE_INCLUDE_FIELDS}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(profile) => <ProfileCard profile={profile} />}
        getKey={(p) => p.address}
        label="profiles"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Subscription (real-time)
// ---------------------------------------------------------------------------

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useProfileSubscription } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useProfileSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });

  // Map subscription shape to ResultsList expectations
  const profiles = data ?? [];
  const isLoading = data === null && isSubscribed;
  const normalizedError =
    error instanceof Error ? error : error != null ? new Error(String(error)) : null;

  return (
    <div className="space-y-4">
      {/* Connection status + invalidate toggle */}
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

      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
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
        onLimitChange={setLimit}
      />
      <IncludeToggles
        configs={PROFILE_INCLUDE_FIELDS}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList
        items={profiles}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(profile) => <ProfileCard profile={profile} />}
        getKey={(p) => p.address}
        label="profiles"
        totalCount={profiles.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProfilesPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Universal Profiles"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useProfile</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useProfiles</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteProfiles</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useProfileSubscription</code> hooks
          against live Hasura data.
        </>
      }
      tabs={[
        {
          value: 'single',
          label: 'Single Profile',
          icon: <User className="size-4" />,
          render: (mode) => <SingleTab mode={mode} />,
        },
        {
          value: 'list',
          label: 'Profile List',
          icon: <Users className="size-4" />,
          render: (mode) => <ListTab mode={mode} />,
        },
        {
          value: 'infinite',
          label: 'Infinite Scroll',
          icon: <Loader2 className="size-4" />,
          render: (mode) => <InfiniteTab mode={mode} />,
        },
        {
          value: 'subscription',
          label: 'Subscription',
          icon: <Radio className="size-4" />,
          render: (mode) => <SubscriptionTab mode={mode} />,
        },
      ]}
    />
  );
}
