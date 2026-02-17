'use client';

import {
  AlertCircle,
  ChevronDown,
  Code2,
  ExternalLink,
  Hash,
  Loader2,
  Search,
  User,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useInfiniteProfiles, useProfile, useProfiles } from '@lsp-indexer/react';
import type {
  Profile,
  ProfileFilter,
  ProfileSort,
  ProfileSortField,
  SortDirection,
} from '@lsp-indexer/react/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ---------------------------------------------------------------------------
// Preset addresses for quick testing
// ---------------------------------------------------------------------------

const PRESET_ADDRESSES = [
  {
    label: 'chill-labs',
    address: '0xB6c10458274431189D4D0dA66ce00dc62A215908',
  },
  {
    label: 'b00ste',
    address: '0x00Aa9761286f21437c90AD2f895ef0dcA3484306',
  },
  {
    label: 'feindura',
    address: '0xCDeC110F9c255357E37f46CD2687be1f7E9B02F7',
  },
] as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function ProfileSkeleton(): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

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

function ErrorAlert({ error }: { error: Error }): React.ReactNode {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

function RawJsonToggle({ data, label }: { data: unknown; label: string }): React.ReactNode {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Code2 className="size-3.5" />
          Toggle Raw JSON ({label})
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Single Profile
// ---------------------------------------------------------------------------

function SingleProfileTab(): React.ReactNode {
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');

  const { profile, isLoading, error, isFetching } = useProfile({ address: queryAddress });

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

      {/* Loading state */}
      {isLoading && <ProfileSkeleton />}

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
            {/* Description */}
            {profile.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>
            )}

            {/* Tags */}
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

            {/* Links */}
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

            {/* Images summary */}
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

            {/* Raw JSON toggle */}
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

function ProfileListTab(): React.ReactNode {
  const [nameFilter, setNameFilter] = useState('');
  const debouncedNameFilter = useDebounce(nameFilter, 300);
  const [sortField, setSortField] = useState<ProfileSortField>('followerCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [limit, setLimit] = useState(10);

  const filter: ProfileFilter | undefined = debouncedNameFilter
    ? { name: debouncedNameFilter }
    : undefined;
  const sort: ProfileSort = { field: sortField, direction: sortDirection };

  const { profiles, totalCount, isLoading, error, isFetching } = useProfiles({
    filter,
    sort,
    limit,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Name filter</label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Sort by</label>
          <Select value={sortField} onValueChange={(v) => setSortField(v as ProfileSortField)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="followerCount">Followers</SelectItem>
              <SelectItem value="followingCount">Following</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Direction</label>
          <Select value={sortDirection} onValueChange={(v) => setSortDirection(v as SortDirection)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Limit</label>
          <Input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 10)}
            className="w-20"
          />
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <>
            <span className="font-medium text-foreground">{totalCount}</span> profiles found
            {isFetching && <Loader2 className="size-3.5 animate-spin" />}
          </>
        )}
      </div>

      {/* Error state */}
      {error && <ErrorAlert error={error} />}

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProfileSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Profiles grid */}
      {!isLoading && profiles.length > 0 && (
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <ProfileCardCompact key={profile.address} profile={profile} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && profiles.length === 0 && (
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            {nameFilter
              ? `No profiles match "${nameFilter}". Try a different search term.`
              : 'No profiles found.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Raw JSON toggle */}
      {profiles.length > 0 && (
        <RawJsonToggle data={profiles} label={`${profiles.length} profiles`} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Infinite Scroll
// ---------------------------------------------------------------------------

function InfiniteScrollTab(): React.ReactNode {
  const [nameFilter, setNameFilter] = useState('');
  const debouncedNameFilter = useDebounce(nameFilter, 300);
  const [sortField, setSortField] = useState<ProfileSortField>('followerCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filter: ProfileFilter | undefined = debouncedNameFilter
    ? { name: debouncedNameFilter }
    : undefined;
  const sort: ProfileSort = { field: sortField, direction: sortDirection };

  const { profiles, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteProfiles({
      filter,
      sort,
      pageSize: 10,
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Name filter</label>
          <Input
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Sort by</label>
          <Select value={sortField} onValueChange={(v) => setSortField(v as ProfileSortField)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="followerCount">Followers</SelectItem>
              <SelectItem value="followingCount">Following</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Direction</label>
          <Select value={sortDirection} onValueChange={(v) => setSortDirection(v as SortDirection)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <>
            <span className="font-medium text-foreground">{profiles.length}</span> profiles loaded
            {isFetching && !isFetchingNextPage && <Loader2 className="size-3.5 animate-spin" />}
          </>
        )}
      </div>

      {/* Error state */}
      {error && <ErrorAlert error={error} />}

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProfileSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Profiles grid */}
      {!isLoading && profiles.length > 0 && (
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <ProfileCardCompact key={profile.address} profile={profile} />
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* No more pages indicator */}
      {!hasNextPage && profiles.length > 0 && !isLoading && (
        <p className="text-center text-sm text-muted-foreground pt-2">
          All profiles loaded ({profiles.length} total)
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !error && profiles.length === 0 && (
        <Alert>
          <Search className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            {nameFilter
              ? `No profiles match "${nameFilter}". Try a different search term.`
              : 'No profiles found.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Raw JSON toggle */}
      {profiles.length > 0 && (
        <RawJsonToggle data={profiles} label={`${profiles.length} profiles`} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProfilesPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Universal Profiles</h1>
        <p className="text-muted-foreground">
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useProfile</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useProfiles</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteProfiles</code> hooks
          against live Hasura data.
        </p>
      </div>

      <Tabs defaultValue="single">
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
          <SingleProfileTab />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <ProfileListTab />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
