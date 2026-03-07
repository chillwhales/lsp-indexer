'use client';

/** Digital Assets playground — LSP7/LSP8 metadata lookup, list, infinite scroll, and subscriptions. */
import { Coins, InfinityIcon, Layers, Radio, Search, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useDigitalAsset as useDigitalAssetNext,
  useDigitalAssets as useDigitalAssetsNext,
  useDigitalAssetSubscription as useDigitalAssetSubscriptionNext,
  useInfiniteDigitalAssets as useInfiniteDigitalAssetsNext,
} from '@lsp-indexer/next';
import {
  useDigitalAsset as useDigitalAssetReact,
  useDigitalAssets as useDigitalAssetsReact,
  useDigitalAssetSubscription as useDigitalAssetSubscriptionReact,
  useInfiniteDigitalAssets as useInfiniteDigitalAssetsReact,
} from '@lsp-indexer/react';
import {
  type DigitalAssetFilter,
  type DigitalAssetSort,
  type DigitalAssetSortField,
  type SortDirection,
  type SortNulls,
  type TokenType,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import {
  type FilterFieldConfig,
  type HookMode,
  type SortOption,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  PlaygroundPageLayout,
  PresetButtons,
  ResultsList,
  SortControls,
  useFilterFields,
  useIncludeToggles,
} from '@/components/playground';

const FILTERS: FilterFieldConfig[] = [
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

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'symbol', label: 'Symbol' },
  { value: 'holderCount', label: 'Holders' },
  { value: 'creatorCount', label: 'Creators' },
  { value: 'totalSupply', label: 'Total Supply' },
  { value: 'createdAt', label: 'Created At' },
];

const PRESETS = [
  { label: 'CHILL (LSP7)', address: '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14' },
  { label: 'Chillwhales (LSP8)', address: '0x86E817172b5c07f7036Bf8aA46e2db9063743A83' },
] as const;

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useDigitalAsset: useDigitalAssetNext,
      useDigitalAssets: useDigitalAssetsNext,
      useInfiniteDigitalAssets: useInfiniteDigitalAssetsNext,
      useDigitalAssetSubscription: useDigitalAssetSubscriptionNext,
    };
  }
  return {
    useDigitalAsset: useDigitalAssetReact,
    useDigitalAssets: useDigitalAssetsReact,
    useInfiniteDigitalAssets: useInfiniteDigitalAssetsReact,
    useDigitalAssetSubscription: useDigitalAssetSubscriptionReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): DigitalAssetFilter | undefined {
  const f: DigitalAssetFilter = {};
  if (debouncedValues.name) f.name = debouncedValues.name;
  if (debouncedValues.symbol) f.symbol = debouncedValues.symbol;
  if (debouncedValues.tokenType) f.tokenType = debouncedValues.tokenType as TokenType;
  if (debouncedValues.category) f.category = debouncedValues.category;
  if (debouncedValues.holderAddress) f.holderAddress = debouncedValues.holderAddress;
  if (debouncedValues.ownerAddress) f.ownerAddress = debouncedValues.ownerAddress;
  return Object.keys(f).length > 0 ? f : undefined;
}

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(FILTERS);
  const [sortField, setSortField] = useState<DigitalAssetSortField>('holderCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
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

function SingleTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAsset } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(DIGITAL_ASSET_INCLUDE_FIELDS);

  const { digitalAsset, isLoading, error, isFetching } = useDigitalAsset({
    address: queryAddress,
    include,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryAddress(address);
  };

  return (
    <div className="space-y-4">
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

      <PresetButtons
        presets={PRESETS}
        onSelect={(p) => {
          setAddress(p.address);
          setQueryAddress(p.address);
        }}
      />

      <IncludeToggles
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
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
      {digitalAsset && <DigitalAssetCard digitalAsset={digitalAsset} isFetching={isFetching} />}
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

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAssets } = useHooks(mode);
  const state = useListState();
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
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
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
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList
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

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteDigitalAssets } = useHooks(mode);
  const state = useListState();

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
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
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
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList
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

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAssetSubscription } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useDigitalAssetSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const digitalAssets = data ?? [];
  const isLoading = data === null && isSubscribed;
  const normalizedError =
    error instanceof Error ? error : error != null ? new Error(String(error)) : null;

  return (
    <div className="space-y-4">
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
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList
        items={digitalAssets}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(asset) => <DigitalAssetCard digitalAsset={asset} />}
        getKey={(a) => a.address}
        label="digital assets"
        totalCount={digitalAssets.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

export default function DigitalAssetsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Digital Assets"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useDigitalAsset</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useDigitalAssets</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteDigitalAssets</code>,
          and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useDigitalAssetSubscription</code>{' '}
          hooks against live Hasura data.
        </>
      }
      tabs={[
        {
          value: 'single',
          label: 'Single Asset',
          icon: <Coins className="size-4" />,
          render: (mode) => <SingleTab mode={mode} />,
        },
        {
          value: 'list',
          label: 'Asset List',
          icon: <Layers className="size-4" />,
          render: (mode) => <ListTab mode={mode} />,
        },
        {
          value: 'infinite',
          label: 'Infinite Scroll',
          icon: <InfinityIcon className="size-4" />,
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
