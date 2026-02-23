'use client';

import { Infinity, List } from 'lucide-react';
import React, { useState } from 'react';

import {
  useCreators as useCreatorsNext,
  useInfiniteCreators as useInfiniteCreatorsNext,
} from '@lsp-indexer/next';
import {
  useCreators as useCreatorsReact,
  useInfiniteCreators as useInfiniteCreatorsReact,
} from '@lsp-indexer/react';
import type {
  CreatorFilter,
  CreatorInclude,
  CreatorSort,
  CreatorSortField,
  SortDirection,
  SortNulls,
} from '@lsp-indexer/types';

import { CreatorCard } from '@/components/creator-card';
import type { FilterFieldConfig, HookMode, SortOption } from '@/components/playground';
import {
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

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

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
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'creatorAddress', label: 'Creator Address' },
  { value: 'digitalAssetAddress', label: 'Digital Asset Address' },
  { value: 'arrayIndex', label: 'Array Index' },
  { value: 'creatorName', label: 'Creator Name' },
  { value: 'digitalAssetName', label: 'Digital Asset Name' },
];

// ---------------------------------------------------------------------------
// Hook resolution by mode
// ---------------------------------------------------------------------------

type CreatorHooks = {
  useCreators: typeof useCreatorsReact;
  useInfiniteCreators: typeof useInfiniteCreatorsReact;
};

function useCreatorHooks(mode: HookMode): CreatorHooks {
  if (mode === 'server') {
    return {
      useCreators: useCreatorsNext as unknown as typeof useCreatorsReact,
      useInfiniteCreators: useInfiniteCreatorsNext as unknown as typeof useInfiniteCreatorsReact,
    };
  }
  return {
    useCreators: useCreatorsReact,
    useInfiniteCreators: useInfiniteCreatorsReact,
  };
}

// ---------------------------------------------------------------------------
// Build filter from debounced values
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared list state for list/infinite tabs
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<CreatorSortField>('timestamp');
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
  }) as CreatorInclude | undefined;

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

// ---------------------------------------------------------------------------
// Include sections (shared between tabs)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tab 1: List — paginated list of creators
// ---------------------------------------------------------------------------

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
        renderItem={(c, i) => (
          <CreatorCard creator={c as unknown as Record<string, unknown>} index={i} />
        )}
        getKey={(c) => `${c.creatorAddress}-${c.digitalAssetAddress}`}
        label="creators"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Infinite — infinite scroll creators
// ---------------------------------------------------------------------------

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
        renderItem={(c, i) => (
          <CreatorCard creator={c as unknown as Record<string, unknown>} index={i} />
        )}
        getKey={(c) => `${c.creatorAddress}-${c.digitalAssetAddress}`}
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
  return (
    <PlaygroundPageLayout
      title="Creators"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useCreators</code> and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteCreators</code> hooks
          against the <code className="text-xs bg-muted px-1 py-0.5 rounded">lsp4_creator</code>{' '}
          table via Hasura (QUERY-06).
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
          icon: <Infinity className="size-4" />,
          render: (mode) => <InfiniteTab mode={mode} />,
        },
      ]}
    />
  );
}
