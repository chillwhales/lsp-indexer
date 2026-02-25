'use client';

import { Infinity, List } from 'lucide-react';
import React, { useState } from 'react';

import {
  useDataChangedEvents as useDataChangedEventsNext,
  useInfiniteDataChangedEvents as useInfiniteDataChangedEventsNext,
  useInfiniteTokenIdDataChangedEvents as useInfiniteTokenIdDataChangedEventsNext,
  useTokenIdDataChangedEvents as useTokenIdDataChangedEventsNext,
} from '@lsp-indexer/next';
import {
  useDataChangedEvents as useDataChangedEventsReact,
  useInfiniteDataChangedEvents as useInfiniteDataChangedEventsReact,
  useInfiniteTokenIdDataChangedEvents as useInfiniteTokenIdDataChangedEventsReact,
  useTokenIdDataChangedEvents as useTokenIdDataChangedEventsReact,
} from '@lsp-indexer/react';
import type {
  DataChangedEventFilter,
  DataChangedEventSort,
  DataChangedEventSortField,
  SortDirection,
  SortNulls,
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventSort,
  TokenIdDataChangedEventSortField,
} from '@lsp-indexer/types';

import { DataChangedEventCard } from '@/components/data-changed-event-card';
import type { FilterFieldConfig, HookMode, SortOption } from '@/components/playground';
import {
  buildNestedInclude,
  DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  FilterFieldsRow,
  IncludeToggles,
  PlaygroundPageLayout,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  SubIncludeSection,
  TOKEN_ID_DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';
import { TokenIdDataChangedEventCard } from '@/components/token-id-data-changed-event-card';

// ---------------------------------------------------------------------------
// Domain config — Data Changed Events (8 filter params, 4 sort fields)
// ---------------------------------------------------------------------------

const DC_FILTERS: FilterFieldConfig[] = [
  {
    key: 'address',
    label: 'Address',
    placeholder: '0x... (contract address)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'dataKey',
    label: 'Data Key',
    placeholder: '0x... (hex data key)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'timestampFrom',
    label: 'Timestamp From',
    placeholder: 'ISO or unix (e.g. 2024-01-01)',
    width: 'w-72',
  },
  {
    key: 'timestampTo',
    label: 'Timestamp To',
    placeholder: 'ISO or unix (e.g. 2025-01-01)',
    width: 'w-72',
  },
  {
    key: 'blockNumberFrom',
    label: 'Block # From',
    placeholder: 'e.g. 12345678',
    mono: true,
    width: 'w-36',
  },
  {
    key: 'blockNumberTo',
    label: 'Block # To',
    placeholder: 'e.g. 99999999',
    mono: true,
    width: 'w-36',
  },
  {
    key: 'universalProfileName',
    label: 'UP Name',
    placeholder: 'Search profile name...',
    width: 'w-64',
  },
  {
    key: 'digitalAssetName',
    label: 'DA Name',
    placeholder: 'Search asset name...',
    width: 'w-64',
  },
];

/** Filter groups rendered as separate rows */
const DC_ROW1 = DC_FILTERS.filter((f) => f.key === 'address' || f.key === 'dataKey');
const DC_ROW2 = DC_FILTERS.filter(
  (f) =>
    f.key === 'timestampFrom' ||
    f.key === 'timestampTo' ||
    f.key === 'blockNumberFrom' ||
    f.key === 'blockNumberTo',
);
const DC_ROW3 = DC_FILTERS.filter(
  (f) => f.key === 'universalProfileName' || f.key === 'digitalAssetName',
);

const DC_SORT_OPTIONS: SortOption[] = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'blockNumber', label: 'Block Number' },
  { value: 'universalProfileName', label: 'UP Name' },
  { value: 'digitalAssetName', label: 'DA Name' },
];

// ---------------------------------------------------------------------------
// Domain config — Token ID Data Changed Events (9 filter params, 4 sort fields)
// ---------------------------------------------------------------------------

const TID_FILTERS: FilterFieldConfig[] = [
  {
    key: 'address',
    label: 'Address',
    placeholder: '0x... (contract address)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'dataKey',
    label: 'Data Key',
    placeholder: '0x... (hex data key)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'tokenId',
    label: 'Token ID',
    placeholder: '0x... (token ID)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'timestampFrom',
    label: 'Timestamp From',
    placeholder: 'ISO or unix (e.g. 2024-01-01)',
    width: 'w-72',
  },
  {
    key: 'timestampTo',
    label: 'Timestamp To',
    placeholder: 'ISO or unix (e.g. 2025-01-01)',
    width: 'w-72',
  },
  {
    key: 'blockNumberFrom',
    label: 'Block # From',
    placeholder: 'e.g. 12345678',
    mono: true,
    width: 'w-36',
  },
  {
    key: 'blockNumberTo',
    label: 'Block # To',
    placeholder: 'e.g. 99999999',
    mono: true,
    width: 'w-36',
  },
  {
    key: 'digitalAssetName',
    label: 'DA Name',
    placeholder: 'Search asset name...',
    width: 'w-64',
  },
  {
    key: 'nftName',
    label: 'NFT Name',
    placeholder: 'Search NFT name...',
    width: 'w-64',
  },
];

/** Filter groups rendered as separate rows */
const TID_ROW1 = TID_FILTERS.filter(
  (f) => f.key === 'address' || f.key === 'dataKey' || f.key === 'tokenId',
);
const TID_ROW2 = TID_FILTERS.filter(
  (f) =>
    f.key === 'timestampFrom' ||
    f.key === 'timestampTo' ||
    f.key === 'blockNumberFrom' ||
    f.key === 'blockNumberTo',
);
const TID_ROW3 = TID_FILTERS.filter((f) => f.key === 'digitalAssetName' || f.key === 'nftName');

const TID_SORT_OPTIONS: SortOption[] = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'blockNumber', label: 'Block Number' },
  { value: 'digitalAssetName', label: 'DA Name' },
  { value: 'nftName', label: 'NFT Name' },
];

// ---------------------------------------------------------------------------
// Hook resolution by mode — Data Changed
// ---------------------------------------------------------------------------

type DataChangedHooks = {
  useDataChangedEvents: typeof useDataChangedEventsReact;
  useInfiniteDataChangedEvents: typeof useInfiniteDataChangedEventsReact;
};

function useDataChangedHooks(mode: HookMode): DataChangedHooks {
  if (mode === 'server') {
    return {
      useDataChangedEvents: useDataChangedEventsNext,
      useInfiniteDataChangedEvents: useInfiniteDataChangedEventsNext,
    };
  }
  return {
    useDataChangedEvents: useDataChangedEventsReact,
    useInfiniteDataChangedEvents: useInfiniteDataChangedEventsReact,
  };
}

// ---------------------------------------------------------------------------
// Hook resolution by mode — Token ID Data Changed
// ---------------------------------------------------------------------------

type TokenIdDataChangedHooks = {
  useTokenIdDataChangedEvents: typeof useTokenIdDataChangedEventsReact;
  useInfiniteTokenIdDataChangedEvents: typeof useInfiniteTokenIdDataChangedEventsReact;
};

function useTokenIdDataChangedHooks(mode: HookMode): TokenIdDataChangedHooks {
  if (mode === 'server') {
    return {
      useTokenIdDataChangedEvents: useTokenIdDataChangedEventsNext,
      useInfiniteTokenIdDataChangedEvents: useInfiniteTokenIdDataChangedEventsNext,
    };
  }
  return {
    useTokenIdDataChangedEvents: useTokenIdDataChangedEventsReact,
    useInfiniteTokenIdDataChangedEvents: useInfiniteTokenIdDataChangedEventsReact,
  };
}

// ---------------------------------------------------------------------------
// Build filters
// ---------------------------------------------------------------------------

function buildDcFilter(vals: Record<string, string>): DataChangedEventFilter | undefined {
  const f: DataChangedEventFilter = {};
  if (vals.address) f.address = vals.address;
  if (vals.dataKey) f.dataKey = vals.dataKey;
  if (vals.timestampFrom) f.timestampFrom = vals.timestampFrom;
  if (vals.timestampTo) f.timestampTo = vals.timestampTo;
  if (vals.blockNumberFrom) {
    const num = Number(vals.blockNumberFrom);
    if (!Number.isNaN(num)) f.blockNumberFrom = num;
  }
  if (vals.blockNumberTo) {
    const num = Number(vals.blockNumberTo);
    if (!Number.isNaN(num)) f.blockNumberTo = num;
  }
  if (vals.universalProfileName) f.universalProfileName = vals.universalProfileName;
  if (vals.digitalAssetName) f.digitalAssetName = vals.digitalAssetName;
  return Object.keys(f).length > 0 ? f : undefined;
}

function buildTidFilter(vals: Record<string, string>): TokenIdDataChangedEventFilter | undefined {
  const f: TokenIdDataChangedEventFilter = {};
  if (vals.address) f.address = vals.address;
  if (vals.dataKey) f.dataKey = vals.dataKey;
  if (vals.tokenId) f.tokenId = vals.tokenId;
  if (vals.timestampFrom) f.timestampFrom = vals.timestampFrom;
  if (vals.timestampTo) f.timestampTo = vals.timestampTo;
  if (vals.blockNumberFrom) {
    const num = Number(vals.blockNumberFrom);
    if (!Number.isNaN(num)) f.blockNumberFrom = num;
  }
  if (vals.blockNumberTo) {
    const num = Number(vals.blockNumberTo);
    if (!Number.isNaN(num)) f.blockNumberTo = num;
  }
  if (vals.digitalAssetName) f.digitalAssetName = vals.digitalAssetName;
  if (vals.nftName) f.nftName = vals.nftName;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared list state — Data Changed
// ---------------------------------------------------------------------------

function useDcListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(DC_FILTERS);
  const [sortField, setSortField] = useState<DataChangedEventSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  );
  const universalProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const digitalAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildDcFilter(debouncedValues);
  const sort: DataChangedEventSort = {
    field: sortField,
    direction: sortDirection,
    nulls: sortNulls,
  };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  const include = buildNestedInclude(includeValues, {
    universalProfile: universalProfile.value,
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
    universalProfile,
    digitalAsset,
  };
}

// ---------------------------------------------------------------------------
// Shared list state — Token ID Data Changed
// ---------------------------------------------------------------------------

function useTidListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(TID_FILTERS);
  const [sortField, setSortField] = useState<TokenIdDataChangedEventSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    TOKEN_ID_DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  );
  const digitalAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildTidFilter(debouncedValues);
  const sort: TokenIdDataChangedEventSort = {
    field: sortField,
    direction: sortDirection,
    nulls: sortNulls,
  };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  // nft is a boolean include in the scalar toggles — no sub-include needed
  const include = buildNestedInclude(includeValues, {
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
    digitalAsset,
  };
}

// ---------------------------------------------------------------------------
// Include sections — Data Changed
// ---------------------------------------------------------------------------

function DcIncludeSections({
  includeValues,
  toggleInclude,
  universalProfile,
  digitalAsset,
}: ReturnType<typeof useDcListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={DATA_CHANGED_EVENT_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Universal Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={universalProfile}
      />
      <SubIncludeSection
        label="Digital Asset"
        subtitle="Digital Asset sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={digitalAsset}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Include sections — Token ID Data Changed
// ---------------------------------------------------------------------------

function TidIncludeSections({
  includeValues,
  toggleInclude,
  digitalAsset,
}: ReturnType<typeof useTidListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={TOKEN_ID_DATA_CHANGED_EVENT_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Digital Asset"
        subtitle="Digital Asset sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={digitalAsset}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Data Changed — List (paginated)
// ---------------------------------------------------------------------------

function DcListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDataChangedEvents } = useDataChangedHooks(mode);
  const state = useDcListState();
  const [limit, setLimit] = useState(10);

  const { dataChangedEvents, totalCount, isLoading, error, isFetching } = useDataChangedEvents({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={DC_ROW1}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={DC_ROW2}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={DC_ROW3}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={DC_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DataChangedEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
      />
      <DcIncludeSections {...state} />
      <ResultsList
        items={dataChangedEvents}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(evt) => <DataChangedEventCard dataChangedEvent={evt} />}
        getKey={(evt) => `${evt.address}-${evt.dataKey}-${evt.dataValue.slice(0, 16)}`}
        label="data changed events"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Data Changed — Infinite
// ---------------------------------------------------------------------------

function DcInfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteDataChangedEvents } = useDataChangedHooks(mode);
  const state = useDcListState();

  const {
    dataChangedEvents,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteDataChangedEvents({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={DC_ROW1}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={DC_ROW2}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={DC_ROW3}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={DC_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DataChangedEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <DcIncludeSections {...state} />
      <ResultsList
        items={dataChangedEvents}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(evt) => <DataChangedEventCard dataChangedEvent={evt} />}
        getKey={(evt) => `${evt.address}-${evt.dataKey}-${evt.dataValue.slice(0, 16)}`}
        label="data changed events"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Token ID Data Changed — List (paginated)
// ---------------------------------------------------------------------------

function TidListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useTokenIdDataChangedEvents } = useTokenIdDataChangedHooks(mode);
  const state = useTidListState();
  const [limit, setLimit] = useState(10);

  const { tokenIdDataChangedEvents, totalCount, isLoading, error, isFetching } =
    useTokenIdDataChangedEvents({
      filter: state.filter,
      sort: state.sort,
      limit,
      include: state.include,
    });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={TID_ROW1}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={TID_ROW2}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={TID_ROW3}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={TID_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as TokenIdDataChangedEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
      />
      <TidIncludeSections {...state} />
      <ResultsList
        items={tokenIdDataChangedEvents}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(evt) => <TokenIdDataChangedEventCard tokenIdDataChangedEvent={evt} />}
        getKey={(evt) =>
          `${evt.address}-${evt.tokenId}-${evt.dataKey}-${evt.dataValue.slice(0, 16)}`
        }
        label="token ID data changed events"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Token ID Data Changed — Infinite
// ---------------------------------------------------------------------------

function TidInfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteTokenIdDataChangedEvents } = useTokenIdDataChangedHooks(mode);
  const state = useTidListState();

  const {
    tokenIdDataChangedEvents,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteTokenIdDataChangedEvents({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterFieldsRow
          configs={TID_ROW1}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={TID_ROW2}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
        <FilterFieldsRow
          configs={TID_ROW3}
          values={state.values}
          onFieldChange={state.setFieldValue}
        />
      </div>
      <SortControls
        options={TID_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as TokenIdDataChangedEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <TidIncludeSections {...state} />
      <ResultsList
        items={tokenIdDataChangedEvents}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(evt) => <TokenIdDataChangedEventCard tokenIdDataChangedEvent={evt} />}
        getKey={(evt) =>
          `${evt.address}-${evt.tokenId}-${evt.dataKey}-${evt.dataValue.slice(0, 16)}`
        }
        label="token ID data changed events"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DataChangedEventsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Data Changed Events"
      description={
        <>
          Exercise{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useDataChangedEvents</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteDataChangedEvents</code>
          ,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useTokenIdDataChangedEvents</code>,
          and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            useInfiniteTokenIdDataChangedEvents
          </code>{' '}
          hooks against ERC725Y data change event tables via Hasura (QUERY-09).
        </>
      }
      tabs={[
        {
          value: 'dc-list',
          label: 'Data Changed',
          icon: <List className="size-4" />,
          render: (mode) => <DcListTab mode={mode} />,
        },
        {
          value: 'dc-infinite',
          label: 'Data Changed \u221E',
          icon: <Infinity className="size-4" />,
          render: (mode) => <DcInfiniteTab mode={mode} />,
        },
        {
          value: 'tid-list',
          label: 'Token ID',
          icon: <List className="size-4" />,
          render: (mode) => <TidListTab mode={mode} />,
        },
        {
          value: 'tid-infinite',
          label: 'Token ID \u221E',
          icon: <Infinity className="size-4" />,
          render: (mode) => <TidInfiniteTab mode={mode} />,
        },
      ]}
    />
  );
}
