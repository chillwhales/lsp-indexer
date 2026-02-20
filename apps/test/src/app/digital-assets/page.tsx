'use client';

import { Coins, Infinity, Layers, Monitor, Search, Server } from 'lucide-react';
import React, { useState } from 'react';

import {
  useDigitalAsset as useDigitalAssetNext,
  useDigitalAssets as useDigitalAssetsNext,
  useInfiniteDigitalAssets as useInfiniteDigitalAssetsNext,
} from '@lsp-indexer/next';
import {
  useDigitalAsset as useDigitalAssetReact,
  useDigitalAssets as useDigitalAssetsReact,
  useInfiniteDigitalAssets as useInfiniteDigitalAssetsReact,
} from '@lsp-indexer/react';
import type {
  DigitalAsset,
  DigitalAssetFilter,
  DigitalAssetSort,
  DigitalAssetSortField,
  SortDirection,
  SortNulls,
  TokenType,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import type { FilterFieldConfig, IncludeToggleConfig, SortOption } from '@/components/playground';
import {
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
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
      useDigitalAsset: useDigitalAssetNext,
      useDigitalAssets: useDigitalAssetsNext,
      useInfiniteDigitalAssets: useInfiniteDigitalAssetsNext,
    };
  }
  return {
    useDigitalAsset: useDigitalAssetReact,
    useDigitalAssets: useDigitalAssetsReact,
    useInfiniteDigitalAssets: useInfiniteDigitalAssetsReact,
  };
}

// ---------------------------------------------------------------------------
// Digital Assets domain config
// ---------------------------------------------------------------------------

const DIGITAL_ASSET_FILTERS: FilterFieldConfig[] = [
  { key: 'name', label: 'Name', placeholder: 'Search by name...' },
  { key: 'symbol', label: 'Symbol', placeholder: 'e.g. CHILL' },
  {
    key: 'tokenType',
    label: 'Token Type',
    options: [
      { value: 'TOKEN', label: 'TOKEN' },
      { value: 'NFT', label: 'NFT' },
      { value: 'COLLECTION', label: 'COLLECTION' },
    ],
  },
  { key: 'category', label: 'Category', placeholder: 'Search by category...' },
  {
    key: 'holderAddress',
    label: 'Holder Address',
    placeholder: '0x... (token holder)',
    mono: true,
  },
  { key: 'ownerAddress', label: 'Owner Address', placeholder: '0x... (controller)', mono: true },
] as const;

const DIGITAL_ASSET_SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'symbol', label: 'Symbol' },
  { value: 'holderCount', label: 'Holders' },
  { value: 'creatorCount', label: 'Creators' },
  { value: 'totalSupply', label: 'Total Supply' },
  { value: 'createdAt', label: 'Created At' },
];

const DIGITAL_ASSET_INCLUDES: IncludeToggleConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'tokenType', label: 'Token Type' },
  { key: 'decimals', label: 'Decimals' },
  { key: 'totalSupply', label: 'Total Supply' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'icons', label: 'Icons' },
  { key: 'images', label: 'Images' },
  { key: 'links', label: 'Links' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'owner', label: 'Owner' },
  { key: 'holderCount', label: 'Holder Count' },
  { key: 'creatorCount', label: 'Creator Count' },
  { key: 'referenceContract', label: 'Reference Contract' },
  { key: 'tokenIdFormat', label: 'Token ID Format' },
  { key: 'baseUri', label: 'Base URI' },
];

const PRESET_ADDRESSES = [
  { label: 'CHILL (LSP7)', address: '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14' },
  { label: 'Chillwhales (LSP8)', address: '0x86E817172b5c07f7036Bf8aA46e2db9063743A83' },
] as const;

/** Build a DigitalAssetFilter from debounced filter field values */
function buildDigitalAssetFilter(
  debouncedValues: Record<string, string>,
): DigitalAssetFilter | undefined {
  const f: DigitalAssetFilter = {};
  if (debouncedValues.name) f.name = debouncedValues.name;
  if (debouncedValues.symbol) f.symbol = debouncedValues.symbol;
  if (debouncedValues.tokenType) {
    f.tokenType = debouncedValues.tokenType as TokenType;
  }
  if (debouncedValues.category) f.category = debouncedValues.category;
  if (debouncedValues.holderAddress) f.holderAddress = debouncedValues.holderAddress;
  if (debouncedValues.ownerAddress) f.ownerAddress = debouncedValues.ownerAddress;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useDigitalAssetListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(DIGITAL_ASSET_FILTERS);
  const [sortField, setSortField] = useState<DigitalAssetSortField>('holderCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(DIGITAL_ASSET_INCLUDES);

  const filter = buildDigitalAssetFilter(debouncedValues);
  const sort: DigitalAssetSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
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
// Tab 1: Single Digital Asset
// ---------------------------------------------------------------------------

function SingleAssetTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAsset } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(DIGITAL_ASSET_INCLUDES);

  const { digitalAsset, isLoading, error, isFetching } = useDigitalAsset({
    address: queryAddress,
    include,
  });

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
          placeholder="Enter digital asset address (0x...)"
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
      <IncludeToggles
        configs={DIGITAL_ASSET_INCLUDES}
        values={includeValues}
        onToggle={toggleInclude}
      />

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
        </Card>
      )}

      {/* Error state */}
      {error && <ErrorAlert error={error} />}

      {/* Success state */}
      {digitalAsset && <DigitalAssetCard digitalAsset={digitalAsset} isFetching={isFetching} />}

      {/* Empty state */}
      {queryAddress && !isLoading && !error && !digitalAsset && (
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertTitle>No Asset Found</AlertTitle>
          <AlertDescription>
            No digital asset found at address{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Asset List
// ---------------------------------------------------------------------------

function AssetListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAssets } = useHooks(mode);
  const state = useDigitalAssetListState();
  const [limit, setLimit] = useState(10);

  const { digitalAssets, totalCount, isLoading, error, isFetching } = useDigitalAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={DIGITAL_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={DIGITAL_ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DigitalAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
      />
      <IncludeToggles
        configs={DIGITAL_ASSET_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList<DigitalAsset>
        items={digitalAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <DigitalAssetCard digitalAsset={asset} />}
        getKey={(a) => a.address}
        label="digital assets"
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
  const { useInfiniteDigitalAssets } = useHooks(mode);
  const state = useDigitalAssetListState();

  const {
    digitalAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteDigitalAssets({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={DIGITAL_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={DIGITAL_ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DigitalAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeToggles
        configs={DIGITAL_ASSET_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList<DigitalAsset>
        items={digitalAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <DigitalAssetCard digitalAsset={asset} />}
        getKey={(a) => a.address}
        label="digital assets"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DigitalAssetsPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Digital Assets</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useDigitalAsset</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useDigitalAssets</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteDigitalAssets</code>{' '}
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
          <TabsTrigger value="single">
            <Coins className="size-4" />
            Single Asset
          </TabsTrigger>
          <TabsTrigger value="list">
            <Layers className="size-4" />
            Asset List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Infinity className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleAssetTab mode={mode} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <AssetListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
