'use client';

import { ExternalLink, Hash, Loader2, Monitor, Search, Server, User, Users } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteProfiles as useInfiniteProfilesNext,
  useProfile as useProfileNext,
  useProfiles as useProfilesNext,
} from '@lsp-indexer/next';
import {
  useInfiniteProfiles as useInfiniteProfilesReact,
  useProfile as useProfileReact,
  useProfiles as useProfilesReact,
} from '@lsp-indexer/react';
import type {
  Profile,
  ProfileFilter,
  ProfileSort,
  ProfileSortField,
  SortDirection,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { FilterFieldConfig, IncludeToggleConfig, SortOption } from '@/components/playground';
import {
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  RawJsonToggle,
  ResultsList,
  SortControls,
  useFilterFields,
  useIncludeToggles,
} from '@/components/playground';

// ---------------------------------------------------------------------------
// Hook mode — pick which package's hooks to use
// ---------------------------------------------------------------------------

type HookMode = 'client' | 'server';

/** Returns the correct hook set based on the current mode */
function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useProfile: useProfileNext,
      useProfiles: useProfilesNext,
      useInfiniteProfiles: useInfiniteProfilesNext,
    };
  }
  return {
    useProfile: useProfileReact,
    useProfiles: useProfilesReact,
    useInfiniteProfiles: useInfiniteProfilesReact,
  };
}

// ---------------------------------------------------------------------------
// Profile domain config — the ONLY things that change per domain
// ---------------------------------------------------------------------------

const PROFILE_FILTERS: FilterFieldConfig[] = [
  { key: 'name', label: 'Name', placeholder: 'Search by name...' },
  { key: 'followedBy', label: 'Followed by', placeholder: '0x... (address)', mono: true },
  { key: 'following', label: 'Following', placeholder: '0x... (address)', mono: true },
  { key: 'tokenOwned', label: 'Owns asset', placeholder: '0x... (token address)', mono: true },
] as const;

const PROFILE_SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'followerCount', label: 'Followers' },
  { value: 'followingCount', label: 'Following' },
];

const PROFILE_INCLUDES: IncludeToggleConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'tags', label: 'Tags' },
  { key: 'links', label: 'Links' },
  { key: 'avatar', label: 'Avatar' },
  { key: 'profileImage', label: 'Profile Image' },
  { key: 'backgroundImage', label: 'Background Image' },
  { key: 'followerCount', label: 'Follower Count' },
  { key: 'followingCount', label: 'Following Count' },
];

const PRESET_ADDRESSES = [
  { label: 'chill-labs', address: '0xB6c10458274431189D4D0dA66ce00dc62A215908' },
  { label: 'b00ste', address: '0x00Aa9761286f21437c90AD2f895ef0dcA3484306' },
  { label: 'feindura', address: '0xCDeC110F9c255357E37f46CD2687be1f7E9B02F7' },
] as const;

/** Build a ProfileFilter from debounced filter field values */
function buildProfileFilter(debouncedValues: Record<string, string>): ProfileFilter | undefined {
  const f: ProfileFilter = {};
  if (debouncedValues.name) f.name = debouncedValues.name;
  if (debouncedValues.followedBy) f.followedBy = debouncedValues.followedBy;
  if (debouncedValues.following) f.following = debouncedValues.following;
  if (debouncedValues.tokenOwned) f.tokenOwned = { address: debouncedValues.tokenOwned };
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Profile-specific components (domain card — varies per domain)
// ---------------------------------------------------------------------------

function ProfileCardCompact({ profile }: { profile: Profile }): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="size-4 text-muted-foreground" />
          {profile.name ?? 'Unnamed Profile'}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate">{profile.address}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {profile.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{profile.description}</p>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {profile.followerCount} followers
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {profile.followingCount} following
          </span>
        </div>
        {profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Hash className="size-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useProfileListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(PROFILE_FILTERS);
  const [sortField, setSortField] = useState<ProfileSortField>('followerCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(PROFILE_INCLUDES);

  const filter = buildProfileFilter(debouncedValues);
  const sort: ProfileSort = { field: sortField, direction: sortDirection };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  return {
    values,
    setFieldValue,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
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

function SingleProfileTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useProfile } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(PROFILE_INCLUDES);

  const { profile, isLoading, error, isFetching } = useProfile({ address: queryAddress, include });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryAddress(address);
  };

  const handlePreset = (presetAddress: string) => {
    setAddress(presetAddress);
    setQueryAddress(presetAddress);
  };

  return (
    <div className="space-y-4">
      {/* Address input */}
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

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Presets:</span>
        {PRESET_ADDRESSES.map((preset) => (
          <Button
            key={preset.address}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset.address)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Include toggles */}
      <IncludeToggles configs={PROFILE_INCLUDES} values={includeValues} onToggle={toggleInclude} />

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardHeader>
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </CardHeader>
        </Card>
      )}

      {/* Error state */}
      {error && <ErrorAlert error={error} />}

      {/* Success state */}
      {profile && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-muted-foreground" />
                  {profile.name ?? 'Unnamed Profile'}
                  {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-1">
                  {profile.address}
                </CardDescription>
              </div>
              <div className="flex gap-3 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{profile.followerCount}</div>
                  <div className="text-muted-foreground text-xs">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{profile.followingCount}</div>
                  <div className="text-muted-foreground text-xs">Following</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>
            )}

            {profile.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Hash className="size-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.links.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Links</h4>
                <div className="space-y-1">
                  {profile.links.map((link, i) => (
                    <a
                      key={`${link.url}-${i}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="size-3.5" />
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Avatar:</span>{' '}
                <Badge variant="outline" className="text-xs">
                  {profile.avatar.length} image{profile.avatar.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Profile Image:</span>{' '}
                <Badge variant="outline" className="text-xs">
                  {profile.profileImage.length} image
                  {profile.profileImage.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Background:</span>{' '}
                <Badge variant="outline" className="text-xs">
                  {profile.backgroundImage.length} image
                  {profile.backgroundImage.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            <RawJsonToggle data={profile} label="profile" />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
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

function ProfileListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useProfiles } = useHooks(mode);
  const state = useProfileListState();
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
        configs={PROFILE_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={PROFILE_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as ProfileSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <IncludeToggles
        configs={PROFILE_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList<Profile>
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(profile) => <ProfileCardCompact profile={profile} />}
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

function InfiniteScrollTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteProfiles } = useHooks(mode);
  const state = useProfileListState();

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
        configs={PROFILE_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={PROFILE_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as ProfileSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <IncludeToggles
        configs={PROFILE_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList<Profile>
        items={profiles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(profile) => <ProfileCardCompact profile={profile} />}
        getKey={(p) => p.address}
        label="profiles"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProfilesPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Universal Profiles</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useProfile</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useProfiles</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteProfiles</code> hooks
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
      <Tabs defaultValue="single" key={mode}>
        <TabsList>
          <TabsTrigger value="single">
            <User className="size-4" />
            Single Profile
          </TabsTrigger>
          <TabsTrigger value="list">
            <Users className="size-4" />
            Profile List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleProfileTab mode={mode} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <ProfileListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
