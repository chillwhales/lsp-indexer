'use client';

/** Creators playground — LSP4 creator attestations with profile and digital asset sub-includes. */
import { InfinityIcon, List, Radio, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useCreators as useCreatorsNext,
  useCreatorSubscription as useCreatorSubscriptionNext,
  useInfiniteCreators as useInfiniteCreatorsNext,
} from '@lsp-indexer/next';
import {
  useCreators as useCreatorsReact,
  useCreatorSubscription as useCreatorSubscriptionReact,
  useInfiniteCreators as useInfiniteCreatorsReact,
} from '@lsp-indexer/react';
import {
  type CreatorFilter,
  type CreatorSort,
  type CreatorSortField,
  type SortDirection,
  type SortNulls,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { CreatorCard } from '@/components/creator-card';
import {
  type FilterFieldConfig,
  type HookMode,
  type SortOption,
  buildNestedInclude,
  CREATOR_INCLUDE_FIELDS,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  FilterFieldsRow,
  IncludeToggles,
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
    key: 'creatorAddress',
    label: 'Creator Address',
    placeholder: '0x... (creator)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'digitalAssetAddress',
    label: 'Digital Asset Address',
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
    key: 'creatorName',
    label: 'Creator Name',
    placeholder: 'Search creator name...',
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
  (f) => f.key === 'creatorAddress' || f.key === 'digitalAssetAddress' || f.key === 'interfaceId',
);
const NAME_FILTERS = ALL_FILTERS.filter((f) => f.key.endsWith('Name'));
const DATE_FILTERS = ALL_FILTERS.filter((f) => f.key.startsWith('timestamp'));

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'creatorAddress', label: 'Creator Address' },
  { value: 'digitalAssetAddress', label: 'Digital Asset Address' },
  { value: 'arrayIndex', label: 'Array Index' },
  { value: 'creatorName', label: 'Creator Name' },
  { value: 'digitalAssetName', label: 'Digital Asset Name' },
];

type CreatorHooks = {
  useCreators: typeof useCreatorsReact;
  useInfiniteCreators: typeof useInfiniteCreatorsReact;
  useCreatorSubscription: typeof useCreatorSubscriptionReact;
};

function useCreatorHooks(mode: HookMode): CreatorHooks {
  if (mode === 'server') {
    return {
      useCreators: useCreatorsNext,
      useInfiniteCreators: useInfiniteCreatorsNext,
      useCreatorSubscription: useCreatorSubscriptionNext,
    };
  }
  return {
    useCreators: useCreatorsReact,
    useInfiniteCreators: useInfiniteCreatorsReact,
    useCreatorSubscription: useCreatorSubscriptionReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): CreatorFilter | undefined {
  const f: CreatorFilter = {};
  if (debouncedValues.creatorAddress) f.creatorAddress = debouncedValues.creatorAddress;
  if (debouncedValues.digitalAssetAddress)
    f.digitalAssetAddress = debouncedValues.digitalAssetAddress;
  if (debouncedValues.interfaceId) f.interfaceId = debouncedValues.interfaceId;
  if (debouncedValues.creatorName) f.creatorName = debouncedValues.creatorName;
  if (debouncedValues.digitalAssetName) f.digitalAssetName = debouncedValues.digitalAssetName;
  if (debouncedValues.timestampFrom) f.timestampFrom = debouncedValues.timestampFrom;
  if (debouncedValues.timestampTo) f.timestampTo = debouncedValues.timestampTo;
  return Object.keys(f).length > 0 ? f : undefined;
}

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<CreatorSortField>('newest');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } =
    useIncludeToggles(CREATOR_INCLUDE_FIELDS);
  const creatorProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const digitalAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: CreatorSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNestedInclude(includeValues, {
    creatorProfile: creatorProfile.value,
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
    creatorProfile,
    digitalAsset,
  };
}

function IncludeSections({
  includeValues,
  toggleInclude,
  creatorProfile,
  digitalAsset,
}: ReturnType<typeof useListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={CREATOR_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Creator Profile"
        subtitle="Creator profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={creatorProfile}
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
  const { useCreators } = useCreatorHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { creators, totalCount, isLoading, error, isFetching } = useCreators({
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
        onSortFieldChange={(v) => state.setSortField(v as CreatorSortField)}
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
        items={creators}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(c, i) => <CreatorCard creator={c} index={i} />}
        getKey={(c) => `${c.creatorAddress}-${c.digitalAssetAddress}`}
        label="creators"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteCreators } = useCreatorHooks(mode);
  const state = useListState();

  const { creators, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteCreators({
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
        onSortFieldChange={(v) => state.setSortField(v as CreatorSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeSections {...state} />
      <ResultsList
        items={creators}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(c, i) => <CreatorCard creator={c} index={i} />}
        getKey={(c) => `${c.creatorAddress}-${c.digitalAssetAddress}`}
        label="creators"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useCreatorSubscription } = useCreatorHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useCreatorSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const creators = data ?? [];
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
        onSortFieldChange={(v) => state.setSortField(v as CreatorSortField)}
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
        items={creators}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(c, i) => <CreatorCard creator={c} index={i} />}
        getKey={(c) => `${c.creatorAddress}-${c.digitalAssetAddress}`}
        label="creators"
        totalCount={creators.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

export default function CreatorsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Creators"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useCreators</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteCreators</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useCreatorSubscription</code> hooks
          against the <code className="text-xs bg-muted px-1 py-0.5 rounded">lsp4_creator</code>{' '}
          table via Hasura.
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
