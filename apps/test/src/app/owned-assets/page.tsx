'use client';

/** Owned Assets playground — LSP7 fungible token ownership with balance and nested relations. */
import { Layers, Radio, Search, Wallet, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteOwnedAssets as useInfiniteOwnedAssetsNext,
  useOwnedAsset as useOwnedAssetNext,
  useOwnedAssets as useOwnedAssetsNext,
  useOwnedAssetSubscription as useOwnedAssetSubscriptionNext,
} from '@lsp-indexer/next';
import {
  useInfiniteOwnedAssets as useInfiniteOwnedAssetsReact,
  useOwnedAsset as useOwnedAssetReact,
  useOwnedAssets as useOwnedAssetsReact,
  useOwnedAssetSubscription as useOwnedAssetSubscriptionReact,
} from '@lsp-indexer/react';
import type {
  OwnedAssetFilter,
  OwnedAssetSort,
  OwnedAssetSortField,
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

import { OwnedAssetCard } from '@/components/owned-asset-card';
import type {
  FilterFieldConfig,
  HookMode,
  IncludeToggleConfig,
  SortOption,
} from '@/components/playground';
import {
  buildNestedInclude,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  PlaygroundPageLayout,
  PresetButtons,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  SubIncludeSection,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';

const ADDRESS_FILTERS: FilterFieldConfig[] = [
  {
    key: 'holderAddress',
    label: 'Holder Address',
    placeholder: '0x... (holder)',
    mono: true,
  },
  {
    key: 'digitalAssetAddress',
    label: 'Asset Address',
    placeholder: '0x... (asset contract)',
    mono: true,
  },
];

const NAME_FILTERS: FilterFieldConfig[] = [
  { key: 'holderName', label: 'Holder Name', placeholder: 'Search by holder name...' },
  { key: 'assetName', label: 'Asset Name', placeholder: 'Search by token name...' },
];

const ALL_FILTERS = [...ADDRESS_FILTERS, ...NAME_FILTERS];

const SORT_OPTIONS: SortOption[] = [
  { value: 'balance', label: 'Balance' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'digitalAssetAddress', label: 'Asset Address' },
  { value: 'holderAddress', label: 'Holder' },
  { value: 'block', label: 'Block' },
  { value: 'digitalAssetName', label: 'Digital Asset Name' },
  { value: 'tokenIdCount', label: 'Token ID Count' },
];

const BASE_INCLUDES: IncludeToggleConfig[] = [
  { key: 'balance', label: 'Balance' },
  { key: 'block', label: 'Block' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'tokenIdCount', label: 'Token ID Count' },
];

const PRESETS = [
  {
    label: 'chill-labs × CHILL',
    holderAddress: '0xB6c10458274431189D4D0dA66ce00dc62A215908',
    digitalAssetAddress: '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14',
  },
  {
    label: 'b00ste × CHILL',
    holderAddress: '0x00Aa9761286f21437c90AD2f895ef0dcA3484306',
    digitalAssetAddress: '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14',
  },
] as const;

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useOwnedAsset: useOwnedAssetNext,
      useOwnedAssets: useOwnedAssetsNext,
      useInfiniteOwnedAssets: useInfiniteOwnedAssetsNext,
      useOwnedAssetSubscription: useOwnedAssetSubscriptionNext,
    };
  }
  return {
    useOwnedAsset: useOwnedAssetReact,
    useOwnedAssets: useOwnedAssetsReact,
    useInfiniteOwnedAssets: useInfiniteOwnedAssetsReact,
    useOwnedAssetSubscription: useOwnedAssetSubscriptionReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): OwnedAssetFilter | undefined {
  const f: OwnedAssetFilter = {};
  if (debouncedValues.holderAddress) f.holderAddress = debouncedValues.holderAddress;
  if (debouncedValues.digitalAssetAddress)
    f.digitalAssetAddress = debouncedValues.digitalAssetAddress;
  if (debouncedValues.holderName) f.holderName = debouncedValues.holderName;
  if (debouncedValues.assetName) f.assetName = debouncedValues.assetName;
  return Object.keys(f).length > 0 ? f : undefined;
}

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<OwnedAssetSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(BASE_INCLUDES);
  const da = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const holder = useSubInclude(PROFILE_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: OwnedAssetSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNestedInclude(includeValues, {
    digitalAsset: da.value,
    holder: holder.value,
  });

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
    da,
    holder,
  };
}

function IncludeSections({
  includeValues,
  toggleInclude,
  da,
  holder,
}: ReturnType<typeof useListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles configs={BASE_INCLUDES} values={includeValues} onToggle={toggleInclude} />
      <SubIncludeSection
        label="Digital Asset"
        subtitle="Digital asset sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={da}
      />
      <SubIncludeSection
        label="Holder Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={holder}
      />
    </>
  );
}

function SingleTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedAssets } = useHooks(mode);
  const [holderInput, setHolderInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [queryHolder, setQueryHolder] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(BASE_INCLUDES);
  const da = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const holder = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const include = buildNestedInclude(includeValues, {
    digitalAsset: da.value,
    holder: holder.value,
  });

  const hasQuery = Boolean(queryHolder) && Boolean(queryAddress);
  const filter: OwnedAssetFilter | undefined = hasQuery
    ? { holderAddress: queryHolder, digitalAssetAddress: queryAddress }
    : undefined;

  const { ownedAssets, isLoading, error, isFetching } = useOwnedAssets({
    filter,
    limit: hasQuery ? 1 : 0,
    include,
  });
  const ownedAsset = hasQuery ? (ownedAssets[0] ?? null) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryHolder(holderInput);
    setQueryAddress(addressInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="owned-asset-holder">Holder Address</Label>
          <Input
            id="owned-asset-holder"
            placeholder="0x... (holder address)"
            value={holderInput}
            onChange={(e) => setHolderInput(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="owned-asset-address">Asset Address</Label>
          <Input
            id="owned-asset-address"
            placeholder="0x... (asset contract address)"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit" disabled={!holderInput || !addressInput}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      <PresetButtons
        presets={PRESETS}
        onSelect={(p) => {
          setHolderInput(p.holderAddress);
          setAddressInput(p.digitalAssetAddress);
          setQueryHolder(p.holderAddress);
          setQueryAddress(p.digitalAssetAddress);
        }}
      />

      <IncludeToggles configs={BASE_INCLUDES} values={includeValues} onToggle={toggleInclude} />
      <SubIncludeSection
        label="Digital Asset"
        subtitle="Digital asset sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={da}
      />
      <SubIncludeSection
        label="Holder Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={holder}
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
      {ownedAsset && <OwnedAssetCard ownedAsset={ownedAsset} isFetching={isFetching} />}
      {hasQuery && !isLoading && !error && !ownedAsset && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertTitle>No Owned Asset Found</AlertTitle>
          <AlertDescription>
            No owned asset found for holder{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryHolder}</code>
            {' on asset '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedAssets } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { ownedAssets, totalCount, isLoading, error, isFetching } = useOwnedAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ADDRESS_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <FilterFieldsRow
        configs={NAME_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
      />
      <IncludeSections {...state} />
      <ResultsList
        items={ownedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ownedAsset) => <OwnedAssetCard ownedAsset={ownedAsset} />}
        getKey={(a) => a.id}
        label="owned assets"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteOwnedAssets } = useHooks(mode);
  const state = useListState();

  const {
    ownedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteOwnedAssets({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ADDRESS_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <FilterFieldsRow
        configs={NAME_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeSections {...state} />
      <ResultsList
        items={ownedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ownedAsset) => <OwnedAssetCard ownedAsset={ownedAsset} />}
        getKey={(a) => a.id}
        label="owned assets"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedAssetSubscription } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useOwnedAssetSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const ownedAssets = data ?? [];
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
        configs={ADDRESS_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <FilterFieldsRow
        configs={NAME_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
      />
      <IncludeSections {...state} />
      <ResultsList
        items={ownedAssets}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(ownedAsset) => <OwnedAssetCard ownedAsset={ownedAsset} />}
        getKey={(a) => a.id}
        label="owned assets"
        totalCount={ownedAssets.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

export default function OwnedAssetsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Owned Assets"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAsset</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAssets</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteOwnedAssets</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAssetSubscription</code>{' '}
          hooks against live Hasura data. Filter by holder to find token balances for a specific
          address.
        </>
      }
      tabs={[
        {
          value: 'single',
          label: 'Single Lookup',
          icon: <Wallet className="size-4" />,
          render: (mode) => <SingleTab mode={mode} />,
        },
        {
          value: 'list',
          label: 'Owned Asset List',
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
