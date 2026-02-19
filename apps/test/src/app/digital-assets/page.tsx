'use client';

import { Coins, Loader2, Monitor, Search, Server } from 'lucide-react';
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
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { FilterFieldConfig, SortOption } from '@/components/playground';
import {
  ErrorAlert,
  FilterFieldsRow,
  RawJsonToggle,
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
// Digital Asset domain config — the ONLY things that change per domain
// ---------------------------------------------------------------------------

const DIGITAL_ASSET_FILTERS: FilterFieldConfig[] = [
  { key: 'name', label: 'Name', placeholder: 'Search by name...' },
  { key: 'symbol', label: 'Symbol', placeholder: 'e.g. CHILL, UP...' },
  { key: 'tokenType', label: 'Token Type', placeholder: '0=Token, 1=NFT, 2=Collection' },
  { key: 'creatorAddress', label: 'Creator', placeholder: '0x... (address)', mono: true },
];

const DIGITAL_ASSET_SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'symbol', label: 'Symbol' },
  { value: 'holderCount', label: 'Holders' },
  { value: 'creatorCount', label: 'Creators' },
];

const PRESET_ADDRESSES = [
  { label: 'CHILL', address: '0x5b8b0e44D3B027f85Ba0fA2b6714eDac3a1B5c37' },
  { label: 'LYX Airdrop', address: '0x3a6c8Fe44C7C09f4f83De4C75abf04AC5abCe2a2' },
  { label: 'LYXE', address: '0xA8Cb7494d23F5a21e83A9Eb0e99F7D1FaB8Bf825' },
] as const;

/** Get a human-readable label for a token type value */
function tokenTypeLabel(value: string | null): string {
  switch (value) {
    case '0':
      return 'LSP7 Token';
    case '1':
      return 'LSP8 NFT';
    case '2':
      return 'LSP8 Collection';
    default:
      return 'Unknown';
  }
}

/** Get a badge variant for token type */
function tokenTypeBadgeVariant(value: string | null): 'default' | 'secondary' | 'outline' {
  switch (value) {
    case '0':
      return 'default';
    case '1':
      return 'secondary';
    case '2':
      return 'outline';
    default:
      return 'outline';
  }
}

/** Build a DigitalAssetFilter from debounced filter field values */
function buildDigitalAssetFilter(
  debouncedValues: Record<string, string>,
): DigitalAssetFilter | undefined {
  const f: DigitalAssetFilter = {};
  if (debouncedValues.name) f.name = debouncedValues.name;
  if (debouncedValues.symbol) f.symbol = debouncedValues.symbol;
  if (debouncedValues.tokenType) f.tokenType = debouncedValues.tokenType;
  if (debouncedValues.creatorAddress) f.creatorAddress = debouncedValues.creatorAddress;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Digital Asset-specific components (domain card — varies per domain)
// ---------------------------------------------------------------------------

function DigitalAssetCard({ asset }: { asset: DigitalAsset }): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="size-4 text-muted-foreground" />
          {asset.name ?? 'Unnamed Asset'}
          {asset.symbol && (
            <Badge variant="outline" className="text-xs font-mono">
              {asset.symbol}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate">{asset.address}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant={tokenTypeBadgeVariant(asset.tokenType)}>
            {tokenTypeLabel(asset.tokenType)}
          </Badge>
          {asset.totalSupply && (
            <Badge variant="outline" className="text-xs">
              Supply: {asset.totalSupply}
            </Badge>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{asset.holderCount} holders</span>
          <span>{asset.creatorCount} creators</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useDigitalAssetListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(DIGITAL_ASSET_FILTERS);
  const [sortField, setSortField] = useState<DigitalAssetSortField>('holderCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filter = buildDigitalAssetFilter(debouncedValues);
  const sort: DigitalAssetSort = { field: sortField, direction: sortDirection };
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
// Tab 1: Single Digital Asset
// ---------------------------------------------------------------------------

function SingleAssetTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAsset } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');

  const { digitalAsset, isLoading, error, isFetching } = useDigitalAsset({
    address: queryAddress,
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
          placeholder="Enter Digital Asset address (0x...)"
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
      {digitalAsset && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="size-5 text-muted-foreground" />
                  {digitalAsset.name ?? 'Unnamed Asset'}
                  {digitalAsset.symbol && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {digitalAsset.symbol}
                    </Badge>
                  )}
                  {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-1">
                  {digitalAsset.address}
                </CardDescription>
              </div>
              <div className="flex gap-3 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{digitalAsset.holderCount}</div>
                  <div className="text-muted-foreground text-xs">Holders</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{digitalAsset.creatorCount}</div>
                  <div className="text-muted-foreground text-xs">Creators</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={tokenTypeBadgeVariant(digitalAsset.tokenType)}>
                {tokenTypeLabel(digitalAsset.tokenType)}
              </Badge>
              {digitalAsset.totalSupply && (
                <Badge variant="outline" className="text-xs">
                  Total Supply: {digitalAsset.totalSupply}
                </Badge>
              )}
            </div>

            <RawJsonToggle data={digitalAsset} label="digital asset" />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {queryAddress && !isLoading && !error && !digitalAsset && (
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertTitle>No Digital Asset Found</AlertTitle>
          <AlertDescription>
            No Digital Asset found at address{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Digital Asset List
// ---------------------------------------------------------------------------

function AssetListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAssets } = useHooks(mode);
  const state = useDigitalAssetListState();
  const [limit, setLimit] = useState(10);

  const { digitalAssets, totalCount, isLoading, error, isFetching } = useDigitalAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
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
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<DigitalAsset>
        items={digitalAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <DigitalAssetCard asset={asset} />}
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
      />
      <ResultsList<DigitalAsset>
        items={digitalAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <DigitalAssetCard asset={asset} />}
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
      <Tabs defaultValue="single" key={mode}>
        <TabsList>
          <TabsTrigger value="single">
            <Coins className="size-4" />
            Single Asset
          </TabsTrigger>
          <TabsTrigger value="list">
            <Coins className="size-4" />
            Asset List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
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
