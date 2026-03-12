'use client';

/** Issued Assets playground — LSP12 asset issuance with issuer profile and digital asset sub-includes. */
import { InfinityIcon, List, Radio, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteIssuedAssets as useInfiniteIssuedAssetsNext,
  useIssuedAssets as useIssuedAssetsNext,
  useIssuedAssetSubscription as useIssuedAssetSubscriptionNext,
} from '@lsp-indexer/next';
import {
  useInfiniteIssuedAssets as useInfiniteIssuedAssetsReact,
  useIssuedAssets as useIssuedAssetsReact,
  useIssuedAssetSubscription as useIssuedAssetSubscriptionReact,
} from '@lsp-indexer/react';
import {
  type IssuedAssetFilter,
  type IssuedAssetSort,
  type IssuedAssetSortField,
  type SortDirection,
  type SortNulls,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { IssuedAssetCard } from '@/components/issued-asset-card';
import {
  type FilterFieldConfig,
  type HookMode,
  type SortOption,
  buildNestedInclude,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  FilterFieldsRow,
  IncludeToggles,
  ISSUED_ASSET_INCLUDE_FIELDS,
  PlaygroundPageLayout,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  SubIncludeSection,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';

const ALL_FILTERS: FilterFieldConfig[] = [
  {
    key: 'issuerAddress',
    label: 'Issuer Address',
    placeholder: '0x... (issuer)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'assetAddress',
    label: 'Asset Address',
    placeholder: '0x... (digital asset)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'interfaceId',
    label: 'Interface ID',
    placeholder: '0x... (ERC165 interface)',
    mono: true,
    width: 'w-48',
  },
  {
    key: 'issuerName',
    label: 'Issuer Name',
    placeholder: 'Search issuer name...',
    width: 'w-80',
  },
  {
    key: 'digitalAssetName',
    label: 'Digital Asset Name',
    placeholder: 'Search asset name...',
    width: 'w-80',
  },
  {
    key: 'timestampFrom',
    label: 'From',
    placeholder: 'ISO or unix (e.g. 2024-01-01 or 1704067200)',
    width: 'w-80',
  },
  {
    key: 'timestampTo',
    label: 'To',
    placeholder: 'ISO or unix (e.g. 2025-01-01 or 1735689600)',
    width: 'w-80',
  },
];

/** Filter groups rendered as separate rows */
const ADDRESS_FILTERS = ALL_FILTERS.filter(
  (f) => f.key === 'issuerAddress' || f.key === 'assetAddress' || f.key === 'interfaceId',
);
const NAME_FILTERS = ALL_FILTERS.filter((f) => f.key.endsWith('Name'));
const DATE_FILTERS = ALL_FILTERS.filter((f) => f.key.startsWith('timestamp'));

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'issuerAddress', label: 'Issuer Address' },
  { value: 'assetAddress', label: 'Asset Address' },
  { value: 'arrayIndex', label: 'Array Index' },
  { value: 'issuerName', label: 'Issuer Name' },
  { value: 'digitalAssetName', label: 'Digital Asset Name' },
];

type IssuedAssetHooks = {
  useIssuedAssets: typeof useIssuedAssetsReact;
  useInfiniteIssuedAssets: typeof useInfiniteIssuedAssetsReact;
  useIssuedAssetSubscription: typeof useIssuedAssetSubscriptionReact;
};

function useIssuedAssetHooks(mode: HookMode): IssuedAssetHooks {
  if (mode === 'server') {
    return {
      useIssuedAssets: useIssuedAssetsNext,
      useInfiniteIssuedAssets: useInfiniteIssuedAssetsNext,
      useIssuedAssetSubscription: useIssuedAssetSubscriptionNext,
    };
  }
  return {
    useIssuedAssets: useIssuedAssetsReact,
    useInfiniteIssuedAssets: useInfiniteIssuedAssetsReact,
    useIssuedAssetSubscription: useIssuedAssetSubscriptionReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): IssuedAssetFilter | undefined {
  const f: IssuedAssetFilter = {};
  if (debouncedValues.issuerAddress) f.issuerAddress = debouncedValues.issuerAddress;
  if (debouncedValues.assetAddress) f.assetAddress = debouncedValues.assetAddress;
  if (debouncedValues.interfaceId) f.interfaceId = debouncedValues.interfaceId;
  if (debouncedValues.issuerName) f.issuerName = debouncedValues.issuerName;
  if (debouncedValues.digitalAssetName) f.digitalAssetName = debouncedValues.digitalAssetName;
  if (debouncedValues.timestampFrom) f.timestampFrom = debouncedValues.timestampFrom;
  if (debouncedValues.timestampTo) f.timestampTo = debouncedValues.timestampTo;
  return Object.keys(f).length > 0 ? f : undefined;
}

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<IssuedAssetSortField>('newest');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    ISSUED_ASSET_INCLUDE_FIELDS,
  );
  const issuerProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const digitalAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: IssuedAssetSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNestedInclude(includeValues, {
    issuerProfile: issuerProfile.value,
    digitalAsset: digitalAsset.value,
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
    issuerProfile,
    digitalAsset,
  };
}

function IncludeSections({
  includeValues,
  toggleInclude,
  issuerProfile,
  digitalAsset,
}: ReturnType<typeof useListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={ISSUED_ASSET_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Issuer Profile"
        subtitle="Issuer profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={issuerProfile}
      />
      <SubIncludeSection
        label="Digital Asset"
        subtitle="Digital asset sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={digitalAsset}
      />
    </>
  );
}

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useIssuedAssets } = useIssuedAssetHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { issuedAssets, totalCount, isLoading, error, isFetching } = useIssuedAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
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
        <FilterFieldsRow
          configs={DATE_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as IssuedAssetSortField)}
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
        items={issuedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ia, i) => <IssuedAssetCard issuedAsset={ia} index={i} />}
        getKey={(ia) => `${ia.issuerAddress}-${ia.assetAddress}`}
        label="issued assets"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteIssuedAssets } = useIssuedAssetHooks(mode);
  const state = useListState();

  const {
    issuedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteIssuedAssets({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
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
        <FilterFieldsRow
          configs={DATE_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as IssuedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeSections {...state} />
      <ResultsList
        items={issuedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ia, i) => <IssuedAssetCard issuedAsset={ia} index={i} />}
        getKey={(ia) => `${ia.issuerAddress}-${ia.assetAddress}`}
        label="issued assets"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useIssuedAssetSubscription } = useIssuedAssetHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useIssuedAssetSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const issuedAssets = data ?? [];
  const isLoading = data === null && isSubscribed;
  const normalizedError =
    error instanceof Error
      ? error
      : error != null
        ? new Error(typeof error === 'string' ? error : 'Unknown error')
        : null;

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

      <div className="space-y-2">
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
        <FilterFieldsRow
          configs={DATE_FILTERS}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as IssuedAssetSortField)}
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
        items={issuedAssets}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(ia, i) => <IssuedAssetCard issuedAsset={ia} index={i} />}
        getKey={(ia) => `${ia.issuerAddress}-${ia.assetAddress}`}
        label="issued assets"
        totalCount={issuedAssets.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

export default function IssuedAssetsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Issued Assets"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useIssuedAssets</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteIssuedAssets</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useIssuedAssetSubscription</code>{' '}
          hooks against the{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">lsp12_issued_asset</code> table via
          Hasura.
        </>
      }
      tabs={[
        {
          value: 'list',
          label: 'List',
          icon: <List className="size-4" />,
          render: (mode) => <ListTab mode={mode} />,
        },
        {
          value: 'infinite',
          label: 'Infinite',
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
