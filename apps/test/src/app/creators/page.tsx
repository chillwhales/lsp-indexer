'use client';

import { Loader2, Monitor, Paintbrush, Server } from 'lucide-react';
import React, { useState } from 'react';

import {
  useCreatorAddresses as useCreatorAddressesNext,
  useInfiniteCreatorAddresses as useInfiniteCreatorAddressesNext,
} from '@lsp-indexer/next';
import {
  useCreatorAddresses as useCreatorAddressesReact,
  useInfiniteCreatorAddresses as useInfiniteCreatorAddressesReact,
} from '@lsp-indexer/react';
import type { Creator, CreatorFilter, CreatorSortField, SortDirection } from '@lsp-indexer/types';

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
      useCreatorAddresses: useCreatorAddressesNext,
      useInfiniteCreatorAddresses: useInfiniteCreatorAddressesNext,
    };
  }
  return {
    useCreatorAddresses: useCreatorAddressesReact,
    useInfiniteCreatorAddresses: useInfiniteCreatorAddressesReact,
  };
}

// ---------------------------------------------------------------------------
// Creator domain config — the ONLY things that change per domain
// ---------------------------------------------------------------------------

const CREATOR_FILTERS: FilterFieldConfig[] = [
  {
    key: 'assetAddress',
    label: 'Asset',
    placeholder: '0x... (digital asset address)',
    mono: true,
  },
  {
    key: 'creatorAddress',
    label: 'Creator',
    placeholder: '0x... (creator UP address)',
    mono: true,
  },
];

const CREATOR_SORT_OPTIONS: SortOption[] = [
  { value: 'assetAddress', label: 'Asset Address' },
  { value: 'creatorAddress', label: 'Creator Address' },
];

/** Build a CreatorFilter from debounced filter field values */
function buildCreatorFilter(debouncedValues: Record<string, string>): CreatorFilter | undefined {
  const f: CreatorFilter = {};
  if (debouncedValues.assetAddress) f.assetAddress = debouncedValues.assetAddress;
  if (debouncedValues.creatorAddress) f.creatorAddress = debouncedValues.creatorAddress;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Creator-specific components (domain card — varies per domain)
// ---------------------------------------------------------------------------

/** Truncate an address to 0x1234...5678 format */
function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CreatorCard({ creator }: { creator: Creator }): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Paintbrush className="size-4 text-muted-foreground" />
          Creator Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[60px]">Asset:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={creator.assetAddress}
          >
            {truncateAddress(creator.assetAddress)}
          </code>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[60px]">Creator:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={creator.creatorAddress}
          >
            {truncateAddress(creator.creatorAddress)}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useCreatorListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(CREATOR_FILTERS);
  const [sortField, setSortField] = useState<CreatorSortField>('assetAddress');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filter = buildCreatorFilter(debouncedValues);
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
// Tab 1: Creator List
// ---------------------------------------------------------------------------

function CreatorListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useCreatorAddresses } = useHooks(mode);
  const state = useCreatorListState();
  const [limit, setLimit] = useState(10);

  const { creators, totalCount, isLoading, error, isFetching } = useCreatorAddresses({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={CREATOR_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={CREATOR_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as CreatorSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<Creator>
        items={creators}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(creator) => <CreatorCard creator={creator} />}
        getKey={(c) => `${c.assetAddress}-${c.creatorAddress}`}
        label="creators"
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
  const { useInfiniteCreatorAddresses } = useHooks(mode);
  const state = useCreatorListState();

  const { creators, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteCreatorAddresses({
      filter: state.filter,
      sort: state.sort,
      pageSize: 10,
    });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={CREATOR_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={CREATOR_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as CreatorSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<Creator>
        items={creators}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(creator) => <CreatorCard creator={creator} />}
        getKey={(c) => `${c.assetAddress}-${c.creatorAddress}`}
        label="creators"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CreatorsPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creator Addresses</h1>
          <p className="text-muted-foreground">
            Exercise{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useCreatorAddresses</code> and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              useInfiniteCreatorAddresses
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
            <Paintbrush className="size-4" />
            Creator List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <CreatorListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
