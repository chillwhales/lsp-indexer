'use client';

import { Clock, Hash, List, Loader2, Monitor, Rss, Server, User } from 'lucide-react';
import React, { useState } from 'react';

import {
  useEncryptedAssetFeed as useEncryptedAssetFeedNext,
  useInfiniteEncryptedAssetFeed as useInfiniteEncryptedAssetFeedNext,
} from '@lsp-indexer/next';
import {
  useEncryptedAssetFeed as useEncryptedAssetFeedReact,
  useInfiniteEncryptedAssetFeed as useInfiniteEncryptedAssetFeedReact,
} from '@lsp-indexer/react';
import type {
  EncryptedFeedEntry,
  EncryptedFeedFilter,
  EncryptedFeedSortField,
  SortDirection,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { FilterFieldConfig, SortOption } from '@/components/playground';
import {
  FilterFieldsRow,
  ResultsList,
  SortControls,
  useFilterFields,
} from '@/components/playground';

// ---------------------------------------------------------------------------
// Hook mode — pick which package's hooks to use
// ---------------------------------------------------------------------------

type HookMode = 'client' | 'server';

/** Returns the correct hook set based on the current mode */
function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useEncryptedAssetFeed: useEncryptedAssetFeedNext,
      useInfiniteEncryptedAssetFeed: useInfiniteEncryptedAssetFeedNext,
    };
  }
  return {
    useEncryptedAssetFeed: useEncryptedAssetFeedReact,
    useInfiniteEncryptedAssetFeed: useInfiniteEncryptedAssetFeedReact,
  };
}

// ---------------------------------------------------------------------------
// Feed domain config — the ONLY things that change per domain
// ---------------------------------------------------------------------------

const FEED_FILTERS: FilterFieldConfig[] = [
  {
    key: 'address',
    label: 'Asset',
    placeholder: '0x... (encrypted asset address)',
    mono: true,
  },
  {
    key: 'universalProfileId',
    label: 'Profile',
    placeholder: '0x... (universal profile address)',
    mono: true,
  },
];

const FEED_SORT_OPTIONS: SortOption[] = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'arrayIndex', label: 'Array Index' },
  { value: 'address', label: 'Address' },
];

/** Build an EncryptedFeedFilter from debounced filter field values */
function buildFeedFilter(debouncedValues: Record<string, string>): EncryptedFeedFilter | undefined {
  const f: EncryptedFeedFilter = {};
  if (debouncedValues.address) f.address = debouncedValues.address;
  if (debouncedValues.universalProfileId) f.universalProfileId = debouncedValues.universalProfileId;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Feed-specific components (domain card — varies per domain)
// ---------------------------------------------------------------------------

/** Truncate a string to first...last format */
function truncate(value: string, startLen = 6, endLen = 4): string {
  if (value.length <= startLen + endLen + 3) return value;
  return `${value.slice(0, startLen)}...${value.slice(-endLen)}`;
}

/** Format an ISO timestamp to a readable local date string */
function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function EncryptedFeedEntryCard({ entry }: { entry: EncryptedFeedEntry }): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rss className="size-4 text-muted-foreground" />
          Feed Entry
          {entry.arrayIndex != null && (
            <Badge variant="outline" className="text-xs">
              #{entry.arrayIndex}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[90px]">Address:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={entry.address}
          >
            {truncate(entry.address)}
          </code>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Hash className="size-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground min-w-[74px]">Content ID:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={entry.contentIdHash}
          >
            {truncate(entry.contentIdHash, 10, 6)}
          </code>
        </div>
        {entry.universalProfileId && (
          <div className="flex items-center gap-2 text-sm">
            <User className="size-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground min-w-[74px]">Profile:</span>
            <code
              className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
              title={entry.universalProfileId}
            >
              {truncate(entry.universalProfileId)}
            </code>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground min-w-[74px]">Created:</span>
          <span className="text-xs">{formatTimestamp(entry.timestamp)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useFeedListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(FEED_FILTERS);
  const [sortField, setSortField] = useState<EncryptedFeedSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filter = buildFeedFilter(debouncedValues);
  const sort = { field: sortField, direction: sortDirection };
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
  };
}

// ---------------------------------------------------------------------------
// Tab 1: Feed Entry List
// ---------------------------------------------------------------------------

function FeedListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useEncryptedAssetFeed } = useHooks(mode);
  const state = useFeedListState();
  const [limit, setLimit] = useState(10);

  const { entries, totalCount, isLoading, error, isFetching } = useEncryptedAssetFeed({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={FEED_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={FEED_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as EncryptedFeedSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<EncryptedFeedEntry>
        items={entries}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(entry) => <EncryptedFeedEntryCard entry={entry} />}
        getKey={(e) => e.id}
        label="feed entries"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Infinite Scroll
// ---------------------------------------------------------------------------

function InfiniteScrollTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteEncryptedAssetFeed } = useHooks(mode);
  const state = useFeedListState();

  const { entries, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteEncryptedAssetFeed({
      filter: state.filter,
      sort: state.sort,
      pageSize: 10,
    });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={FEED_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={FEED_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as EncryptedFeedSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<EncryptedFeedEntry>
        items={entries}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(entry) => <EncryptedFeedEntryCard entry={entry} />}
        getKey={(e) => e.id}
        label="feed entries"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FeedPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Encrypted Asset Feed</h1>
          <p className="text-muted-foreground">
            Exercise{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useEncryptedAssetFeed</code> and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              useInfiniteEncryptedAssetFeed
            </code>{' '}
            hooks against live Hasura data.
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
      <Tabs defaultValue="list" key={mode}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="size-4" />
            Feed List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <FeedListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
