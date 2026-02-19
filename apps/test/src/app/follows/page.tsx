'use client';

import { Hash, Loader2, Monitor, Search, Server, Users } from 'lucide-react';
import React, { useState } from 'react';

import {
  useFollowCount as useFollowCountNext,
  useFollowers as useFollowersNext,
  useFollowing as useFollowingNext,
  useInfiniteFollowers as useInfiniteFollowersNext,
  useInfiniteFollowing as useInfiniteFollowingNext,
} from '@lsp-indexer/next';
import {
  useFollowCount as useFollowCountReact,
  useFollowers as useFollowersReact,
  useFollowing as useFollowingReact,
  useInfiniteFollowers as useInfiniteFollowersReact,
  useInfiniteFollowing as useInfiniteFollowingReact,
} from '@lsp-indexer/react';
import type { Follower, FollowerSortField, SortDirection } from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { SortOption } from '@/components/playground';
import { ErrorAlert, RawJsonToggle, ResultsList, SortControls } from '@/components/playground';

// ---------------------------------------------------------------------------
// Hook mode — pick which package's hooks to use
// ---------------------------------------------------------------------------

type HookMode = 'client' | 'server';

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useFollowers: useFollowersNext,
      useFollowing: useFollowingNext,
      useFollowCount: useFollowCountNext,
      useInfiniteFollowers: useInfiniteFollowersNext,
      useInfiniteFollowing: useInfiniteFollowingNext,
    };
  }
  return {
    useFollowers: useFollowersReact,
    useFollowing: useFollowingReact,
    useFollowCount: useFollowCountReact,
    useInfiniteFollowers: useInfiniteFollowersReact,
    useInfiniteFollowing: useInfiniteFollowingReact,
  };
}

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

const SOCIAL_SORT_OPTIONS: SortOption[] = [
  { value: 'followerAddress', label: 'Follower Address' },
  { value: 'followedAddress', label: 'Followed Address' },
];

const PRESET_ADDRESSES = [
  { label: 'chill-labs', address: '0xB6c10458274431189D4D0dA66ce00dc62A215908' },
  { label: 'b00ste', address: '0x00Aa9761286f21437c90AD2f895ef0dcA3484306' },
  { label: 'feindura', address: '0xCDeC110F9c255357E37f46CD2687be1f7E9B02F7' },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Domain card components
// ---------------------------------------------------------------------------

function FollowerCard({ follower }: { follower: Follower }): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-muted-foreground" />
          Follower
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[80px]">Follower:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={follower.followerAddress}
          >
            {truncateAddress(follower.followerAddress)}
          </code>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[80px]">Followed:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={follower.followedAddress}
          >
            {truncateAddress(follower.followedAddress)}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

function FollowingCard({ follower }: { follower: Follower }): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-muted-foreground" />
          Following
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[80px]">From:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={follower.followerAddress}
          >
            {truncateAddress(follower.followerAddress)}
          </code>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[80px]">Follows:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={follower.followedAddress}
          >
            {truncateAddress(follower.followedAddress)}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Address input with presets
// ---------------------------------------------------------------------------

function AddressInput({
  address,
  setAddress,
  onSubmit,
  onPreset,
}: {
  address: string;
  setAddress: (v: string) => void;
  onSubmit: () => void;
  onPreset: (address: string) => void;
}): React.ReactNode {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Enter address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
        <Button type="submit" disabled={!address}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Presets:</span>
        {PRESET_ADDRESSES.map((preset) => (
          <Button
            key={preset.address}
            variant="outline"
            size="sm"
            onClick={() => onPreset(preset.address)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Followers tab — List + Infinite sub-tabs
// ---------------------------------------------------------------------------

function FollowersTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowers, useInfiniteFollowers } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [sortField, setSortField] = useState<FollowerSortField>('followerAddress');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [limit, setLimit] = useState(10);

  const sort = { field: sortField, direction: sortDirection };

  const handlePreset = (presetAddress: string) => {
    setAddress(presetAddress);
    setQueryAddress(presetAddress);
  };

  return (
    <div className="space-y-4">
      <AddressInput
        address={address}
        setAddress={setAddress}
        onSubmit={() => setQueryAddress(address)}
        onPreset={handlePreset}
      />

      {queryAddress && (
        <>
          <SortControls
            options={SOCIAL_SORT_OPTIONS}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={(v) => setSortField(v as FollowerSortField)}
            onSortDirectionChange={(v) => setSortDirection(v as SortDirection)}
            limit={limit}
            onLimitChange={setLimit}
          />

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="infinite">Infinite Scroll</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <FollowersListSub
                useFollowers={useFollowers}
                address={queryAddress}
                sort={sort}
                limit={limit}
              />
            </TabsContent>

            <TabsContent value="infinite" className="mt-4">
              <FollowersInfiniteSub
                useInfiniteFollowers={useInfiniteFollowers}
                address={queryAddress}
                sort={sort}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function FollowersListSub({
  useFollowers,
  address,
  sort,
  limit,
}: {
  useFollowers: ReturnType<typeof useHooks>['useFollowers'];
  address: string;
  sort: { field: FollowerSortField; direction: SortDirection };
  limit: number;
}): React.ReactNode {
  const { followers, totalCount, isLoading, error, isFetching } = useFollowers({
    address,
    sort,
    limit,
  });

  return (
    <ResultsList<Follower>
      items={followers}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      renderItem={(f) => <FollowerCard follower={f} />}
      getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
      label="followers"
      totalCount={totalCount}
      hasActiveFilter
    />
  );
}

function FollowersInfiniteSub({
  useInfiniteFollowers,
  address,
  sort,
}: {
  useInfiniteFollowers: ReturnType<typeof useHooks>['useInfiniteFollowers'];
  address: string;
  sort: { field: FollowerSortField; direction: SortDirection };
}): React.ReactNode {
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
    sort,
    pageSize: 10,
  });

  return (
    <ResultsList<Follower>
      items={followers}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      renderItem={(f) => <FollowerCard follower={f} />}
      getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
      label="followers"
      hasActiveFilter
      infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
    />
  );
}

// ---------------------------------------------------------------------------
// Following tab — List + Infinite sub-tabs
// ---------------------------------------------------------------------------

function FollowingTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowing, useInfiniteFollowing } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [sortField, setSortField] = useState<FollowerSortField>('followedAddress');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [limit, setLimit] = useState(10);

  const sort = { field: sortField, direction: sortDirection };

  const handlePreset = (presetAddress: string) => {
    setAddress(presetAddress);
    setQueryAddress(presetAddress);
  };

  return (
    <div className="space-y-4">
      <AddressInput
        address={address}
        setAddress={setAddress}
        onSubmit={() => setQueryAddress(address)}
        onPreset={handlePreset}
      />

      {queryAddress && (
        <>
          <SortControls
            options={SOCIAL_SORT_OPTIONS}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={(v) => setSortField(v as FollowerSortField)}
            onSortDirectionChange={(v) => setSortDirection(v as SortDirection)}
            limit={limit}
            onLimitChange={setLimit}
          />

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="infinite">Infinite Scroll</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <FollowingListSub
                useFollowing={useFollowing}
                address={queryAddress}
                sort={sort}
                limit={limit}
              />
            </TabsContent>

            <TabsContent value="infinite" className="mt-4">
              <FollowingInfiniteSub
                useInfiniteFollowing={useInfiniteFollowing}
                address={queryAddress}
                sort={sort}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function FollowingListSub({
  useFollowing,
  address,
  sort,
  limit,
}: {
  useFollowing: ReturnType<typeof useHooks>['useFollowing'];
  address: string;
  sort: { field: FollowerSortField; direction: SortDirection };
  limit: number;
}): React.ReactNode {
  const { following, totalCount, isLoading, error, isFetching } = useFollowing({
    address,
    sort,
    limit,
  });

  return (
    <ResultsList<Follower>
      items={following}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      renderItem={(f) => <FollowingCard follower={f} />}
      getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
      label="following"
      totalCount={totalCount}
      hasActiveFilter
    />
  );
}

function FollowingInfiniteSub({
  useInfiniteFollowing,
  address,
  sort,
}: {
  useInfiniteFollowing: ReturnType<typeof useHooks>['useInfiniteFollowing'];
  address: string;
  sort: { field: FollowerSortField; direction: SortDirection };
}): React.ReactNode {
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
    sort,
    pageSize: 10,
  });

  return (
    <ResultsList<Follower>
      items={following}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      renderItem={(f) => <FollowingCard follower={f} />}
      getKey={(f) => `${f.followerAddress}-${f.followedAddress}`}
      label="following"
      hasActiveFilter
      infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
    />
  );
}

// ---------------------------------------------------------------------------
// Follow Count tab
// ---------------------------------------------------------------------------

function FollowCountTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useFollowCount } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');

  const { followCount, isLoading, error, isFetching } = useFollowCount({
    address: queryAddress,
  });

  const handlePreset = (presetAddress: string) => {
    setAddress(presetAddress);
    setQueryAddress(presetAddress);
  };

  return (
    <div className="space-y-4">
      <AddressInput
        address={address}
        setAddress={setAddress}
        onSubmit={() => setQueryAddress(address)}
        onPreset={handlePreset}
      />

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading follow counts...
            </div>
          </CardContent>
        </Card>
      )}

      {error && <ErrorAlert error={error} />}

      {followCount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="size-4 text-muted-foreground" />
              Follow Counts
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {followCount.followerCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {followCount.followingCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Following</div>
              </div>
            </div>
            <div className="mt-4">
              <RawJsonToggle data={followCount} label="followCount" />
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
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follows</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowers</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowing</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useFollowCount</code> hooks
            against live Hasura data.
          </p>
        </div>

        {/* Client / Server mode toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={mode === 'client' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('client')}
            className="gap-1.5"
          >
            <Monitor className="size-3.5" />
            Client
          </Button>
          <Button
            variant={mode === 'server' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('server')}
            className="gap-1.5"
          >
            <Server className="size-3.5" />
            Server
          </Button>
        </div>
      </div>

      {/* Mode indicator */}
      <div className="flex items-center gap-2">
        <Badge variant={mode === 'client' ? 'default' : 'secondary'}>
          {mode === 'client' ? '@lsp-indexer/react' : '@lsp-indexer/next'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {mode === 'client' ? 'Browser → Hasura directly' : 'Browser → Server Action → Hasura'}
        </span>
      </div>

      {/* key={mode} forces full remount when switching — avoids hook-rule violations */}
      <Tabs defaultValue="followers" key={mode}>
        <TabsList>
          <TabsTrigger value="followers">
            <Users className="size-4" />
            Followers
          </TabsTrigger>
          <TabsTrigger value="following">
            <Users className="size-4" />
            Following
          </TabsTrigger>
          <TabsTrigger value="count">
            <Hash className="size-4" />
            Follow Count
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="mt-4">
          <FollowersTab mode={mode} />
        </TabsContent>

        <TabsContent value="following" className="mt-4">
          <FollowingTab mode={mode} />
        </TabsContent>

        <TabsContent value="count" className="mt-4">
          <FollowCountTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
