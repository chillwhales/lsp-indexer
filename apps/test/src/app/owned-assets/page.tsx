'use client';

import { Infinity, Layers, Search, Wallet } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteOwnedAssets as useInfiniteOwnedAssetsNext,
  useOwnedAsset as useOwnedAssetNext,
  useOwnedAssets as useOwnedAssetsNext,
} from '@lsp-indexer/next';
import {
  useInfiniteOwnedAssets as useInfiniteOwnedAssetsReact,
  useOwnedAsset as useOwnedAssetReact,
  useOwnedAssets as useOwnedAssetsReact,
} from '@lsp-indexer/react';
import type {
  OwnedAsset,
  OwnedAssetFilter,
  OwnedAssetInclude,
  OwnedAssetSort,
  OwnedAssetSortField,
  SortDirection,
  SortNulls,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

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

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

const FILTERS: FilterFieldConfig[] = [
  { key: 'owner', label: 'Owner Address', placeholder: '0x... (owner)', mono: true },
  { key: 'address', label: 'Asset Address', placeholder: '0x... (asset contract)', mono: true },
  { key: 'assetName', label: 'Asset Name', placeholder: 'Search by token name...' },
];

const SORT_OPTIONS: SortOption[] = [
  { value: 'balance', label: 'Balance' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'address', label: 'Address' },
  { value: 'owner', label: 'Owner' },
  { value: 'block', label: 'Block' },
  { value: 'digitalAssetName', label: 'Digital Asset Name' },
  { value: 'tokenIdCount', label: 'Token ID Count' },
];

const BASE_INCLUDES: IncludeToggleConfig[] = [{ key: 'tokenIdCount', label: 'Token ID Count' }];

const PRESETS = [
  {
    label: 'chill-labs × CHILL',
    owner: '0xB6c10458274431189D4D0dA66ce00dc62A215908',
    address: '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14',
  },
  {
    label: 'b00ste × CHILL',
    owner: '0x00Aa9761286f21437c90AD2f895ef0dcA3484306',
    address: '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14',
  },
] as const;

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useOwnedAsset: useOwnedAssetNext,
      useOwnedAssets: useOwnedAssetsNext,
      useInfiniteOwnedAssets: useInfiniteOwnedAssetsNext,
    };
  }
  return {
    useOwnedAsset: useOwnedAssetReact,
    useOwnedAssets: useOwnedAssetsReact,
    useInfiniteOwnedAssets: useInfiniteOwnedAssetsReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): OwnedAssetFilter | undefined {
  const f: OwnedAssetFilter = {};
  if (debouncedValues.owner) f.owner = debouncedValues.owner;
  if (debouncedValues.address) f.address = debouncedValues.address;
  if (debouncedValues.assetName) f.assetName = debouncedValues.assetName;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared list state
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(FILTERS);
  const [sortField, setSortField] = useState<OwnedAssetSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(BASE_INCLUDES);
  const da = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const up = useSubInclude(PROFILE_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: OwnedAssetSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNestedInclude(includeValues, {
    digitalAsset: da.value,
    universalProfile: up.value,
  }) as OwnedAssetInclude | undefined;

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
    up,
  };
}

// ---------------------------------------------------------------------------
// Sub-include sections (shared between all 3 tabs)
// ---------------------------------------------------------------------------

function IncludeSections({
  includeValues,
  toggleInclude,
  da,
  up,
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
        label="Universal Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={up}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Single Owned Asset
// ---------------------------------------------------------------------------

function SingleTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedAssets } = useHooks(mode);
  const [ownerInput, setOwnerInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [queryOwner, setQueryOwner] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(BASE_INCLUDES);
  const da = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const up = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const include = buildNestedInclude(includeValues, {
    digitalAsset: da.value,
    universalProfile: up.value,
  }) as OwnedAssetInclude | undefined;

  const hasQuery = Boolean(queryOwner) && Boolean(queryAddress);
  const filter: OwnedAssetFilter | undefined = hasQuery
    ? { owner: queryOwner, address: queryAddress }
    : undefined;

  const { ownedAssets, isLoading, error, isFetching } = useOwnedAssets({
    filter,
    limit: hasQuery ? 1 : 0,
    include,
  });
  const ownedAsset = hasQuery ? (ownedAssets[0] ?? null) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryOwner(ownerInput);
    setQueryAddress(addressInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="owned-asset-owner">Holder Address</Label>
          <Input
            id="owned-asset-owner"
            placeholder="0x... (holder / owner address)"
            value={ownerInput}
            onChange={(e) => setOwnerInput(e.target.value)}
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
        <Button type="submit" disabled={!ownerInput || !addressInput}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      <PresetButtons
        presets={PRESETS}
        onSelect={(p) => {
          setOwnerInput(p.owner);
          setAddressInput(p.address);
          setQueryOwner(p.owner);
          setQueryAddress(p.address);
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
        label="Universal Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={up}
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
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryOwner}</code>
            {' on asset '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Owned Asset List
// ---------------------------------------------------------------------------

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
        configs={FILTERS}
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
      <ResultsList<OwnedAsset>
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

// ---------------------------------------------------------------------------
// Tab 3: Infinite Scroll
// ---------------------------------------------------------------------------

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
        configs={FILTERS}
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
      <ResultsList<OwnedAsset>
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

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function OwnedAssetsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Owned Assets"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAsset</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAssets</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteOwnedAssets</code> hooks
          against live Hasura data. Filter by owner to find token balances for a specific address
          (QUERY-04).
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
          icon: <Infinity className="size-4" />,
          render: (mode) => <InfiniteTab mode={mode} />,
        },
      ]}
    />
  );
}
