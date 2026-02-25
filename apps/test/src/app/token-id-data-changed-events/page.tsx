'use client';

import { Infinity, List } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteTokenIdDataChangedEvents as useInfiniteTokenIdDataChangedEventsNext,
  useTokenIdDataChangedEvents as useTokenIdDataChangedEventsNext,
} from '@lsp-indexer/next';
import {
  useInfiniteTokenIdDataChangedEvents as useInfiniteTokenIdDataChangedEventsReact,
  useTokenIdDataChangedEvents as useTokenIdDataChangedEventsReact,
} from '@lsp-indexer/react';
import type {
  SortDirection,
  SortNulls,
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventSort,
  TokenIdDataChangedEventSortField,
} from '@lsp-indexer/types';

import type { FilterFieldConfig, HookMode, SortOption } from '@/components/playground';
import {
  buildNestedInclude,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  FilterFieldsRow,
  IncludeToggles,
  PlaygroundPageLayout,
  ResultsList,
  SortControls,
  SubIncludeSection,
  TOKEN_ID_DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';
import { TokenIdDataChangedEventCard } from '@/components/token-id-data-changed-event-card';
import { Switch } from '@/components/ui/switch';

// ---------------------------------------------------------------------------
// Domain config — Token ID Data Changed Events (9 filter params, 4 sort fields)
// ---------------------------------------------------------------------------

const ALL_FILTERS: FilterFieldConfig[] = [
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
const ROW1 = ALL_FILTERS.filter(
  (f) => f.key === 'address' || f.key === 'dataKey' || f.key === 'tokenId',
);
const ROW2 = ALL_FILTERS.filter(
  (f) =>
    f.key === 'timestampFrom' ||
    f.key === 'timestampTo' ||
    f.key === 'blockNumberFrom' ||
    f.key === 'blockNumberTo',
);
const ROW3 = ALL_FILTERS.filter((f) => f.key === 'digitalAssetName' || f.key === 'nftName');

const SORT_OPTIONS: SortOption[] = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'blockNumber', label: 'Block Number' },
  { value: 'digitalAssetName', label: 'DA Name' },
  { value: 'nftName', label: 'NFT Name' },
];

// ---------------------------------------------------------------------------
// Hook resolution by mode
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
// Build filter
// ---------------------------------------------------------------------------

function buildFilter(vals: Record<string, string>): TokenIdDataChangedEventFilter | undefined {
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
// Build include — merges scalar toggles, Digital Asset sub-include, and NFT boolean
// ---------------------------------------------------------------------------

/**
 * Build the TokenIdDataChangedEventInclude object.
 *
 * The `nft` field is boolean-only (no sub-field toggles) — `true` means
 * "fetch the lightweight NFT relation", `false` means "skip it".
 *
 * Returns `undefined` when everything is at defaults (all scalars ON,
 * Digital Asset ON with all sub-fields ON, NFT ON), which tells the
 * service to include everything.
 */
function buildTidInclude(
  baseValues: Record<string, boolean>,
  digitalAssetValue: Record<string, boolean> | undefined,
  nftEnabled: boolean,
): TokenIdDataChangedEventInclude | undefined {
  // When nft is ON, delegate to buildNestedInclude — if everything is defaults
  // it returns undefined (= include everything, including nft).
  const nested = buildNestedInclude(baseValues, {
    digitalAsset: digitalAssetValue,
  });

  if (!nested && nftEnabled) return undefined; // All defaults

  // Something is customized — build explicit include with nft boolean
  const include: TokenIdDataChangedEventInclude = nested
    ? { ...nested, nft: nftEnabled }
    : { ...baseValues, digitalAsset: digitalAssetValue ?? {}, nft: nftEnabled };

  return include;
}

// ---------------------------------------------------------------------------
// Shared list state
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<TokenIdDataChangedEventSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    TOKEN_ID_DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  );
  const digitalAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const [nftEnabled, setNftEnabled] = useState(true);

  const filter = buildFilter(debouncedValues);
  const sort: TokenIdDataChangedEventSort = {
    field: sortField,
    direction: sortDirection,
    nulls: sortNulls,
  };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  const include = buildTidInclude(includeValues, digitalAsset.value, nftEnabled);

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
    nftEnabled,
    setNftEnabled,
  };
}

// ---------------------------------------------------------------------------
// Include sections
// ---------------------------------------------------------------------------

function TidIncludeSections({
  includeValues,
  toggleInclude,
  digitalAsset,
  nftEnabled,
  setNftEnabled,
}: ReturnType<typeof useListState>): React.ReactNode {
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
      {/* NFT is a boolean-only sub-include — no nested sub-fields, just on/off */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
          <Switch size="sm" checked={nftEnabled} onCheckedChange={setNftEnabled} />
          <span className={nftEnabled ? 'text-foreground font-medium' : 'text-muted-foreground'}>
            NFT Info
          </span>
        </label>
        {nftEnabled && (
          <div className="ml-6 pl-3 border-l">
            <span className="text-xs text-muted-foreground">
              Fetches lightweight NFT relation (address, tokenId, isBurned, isMinted, name)
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: List (paginated)
// ---------------------------------------------------------------------------

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useTokenIdDataChangedEvents } = useTokenIdDataChangedHooks(mode);
  const state = useListState();
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
        <FilterFieldsRow configs={ROW1} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW2} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW3} values={state.values} onFieldChange={state.setFieldValue} />
      </div>
      <SortControls
        options={SORT_OPTIONS}
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
// Tab 2: Infinite
// ---------------------------------------------------------------------------

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteTokenIdDataChangedEvents } = useTokenIdDataChangedHooks(mode);
  const state = useListState();

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
        <FilterFieldsRow configs={ROW1} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW2} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW3} values={state.values} onFieldChange={state.setFieldValue} />
      </div>
      <SortControls
        options={SORT_OPTIONS}
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

export default function TokenIdDataChangedEventsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Token ID Data Changed Events"
      description={
        <>
          Exercise{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useTokenIdDataChangedEvents</code>{' '}
          and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            useInfiniteTokenIdDataChangedEvents
          </code>{' '}
          hooks against ERC725Y per-token data change events via Hasura (QUERY-09).
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
