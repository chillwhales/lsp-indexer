'use client';

/** Data Changed Events playground — ERC725Y DataChanged events with data key name resolution. */
import { DATA_KEY_NAMES, DataKeyNameSchema } from '@chillwhales/erc725';
import { Clock, Infinity, List, Radio, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useDataChangedEvents as useDataChangedEventsNext,
  useDataChangedEventSubscription as useDataChangedEventSubscriptionNext,
  useInfiniteDataChangedEvents as useInfiniteDataChangedEventsNext,
  useLatestDataChangedEvent as useLatestDataChangedEventNext,
} from '@lsp-indexer/next';
import {
  useDataChangedEvents as useDataChangedEventsReact,
  useDataChangedEventSubscription as useDataChangedEventSubscriptionReact,
  useInfiniteDataChangedEvents as useInfiniteDataChangedEventsReact,
  useLatestDataChangedEvent as useLatestDataChangedEventReact,
} from '@lsp-indexer/react';
import type {
  DataChangedEventFilter,
  DataChangedEventSort,
  DataChangedEventSortField,
  SortDirection,
  SortNulls,
} from '@lsp-indexer/types';

import { DataChangedEventCard } from '@/components/data-changed-event-card';
import type { FilterFieldConfig, HookMode, SortOption } from '@/components/playground';
import {
  buildNestedInclude,
  DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  ErrorAlert,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

/** Data key name options for select dropdowns — built from the data-keys registry */
const DATA_KEY_NAME_OPTIONS = DATA_KEY_NAMES.map((name) => ({ value: name, label: name }));

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
    key: 'dataKeyName',
    label: 'Data Key Name',
    placeholder: 'All Data Keys',
    options: DATA_KEY_NAME_OPTIONS,
    width: 'w-64',
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
const ROW1 = ALL_FILTERS.filter(
  (f) => f.key === 'address' || f.key === 'dataKey' || f.key === 'dataKeyName',
);
const ROW2 = ALL_FILTERS.filter(
  (f) =>
    f.key === 'timestampFrom' ||
    f.key === 'timestampTo' ||
    f.key === 'blockNumberFrom' ||
    f.key === 'blockNumberTo',
);
const ROW3 = ALL_FILTERS.filter(
  (f) => f.key === 'universalProfileName' || f.key === 'digitalAssetName',
);

/** Filter fields for the Latest tab (simplified — address + data key identification) */
const LATEST_FILTERS: FilterFieldConfig[] = [
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
    key: 'dataKeyName',
    label: 'Data Key Name',
    placeholder: 'All Data Keys',
    options: DATA_KEY_NAME_OPTIONS,
    width: 'w-64',
  },
];

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'universalProfileName', label: 'UP Name' },
  { value: 'digitalAssetName', label: 'DA Name' },
];

type DataChangedHooks = {
  useLatestDataChangedEvent: typeof useLatestDataChangedEventReact;
  useDataChangedEvents: typeof useDataChangedEventsReact;
  useInfiniteDataChangedEvents: typeof useInfiniteDataChangedEventsReact;
  useDataChangedEventSubscription: typeof useDataChangedEventSubscriptionReact;
};

function useDataChangedHooks(mode: HookMode): DataChangedHooks {
  if (mode === 'server') {
    return {
      useLatestDataChangedEvent: useLatestDataChangedEventNext,
      useDataChangedEvents: useDataChangedEventsNext,
      useInfiniteDataChangedEvents: useInfiniteDataChangedEventsNext,
      useDataChangedEventSubscription: useDataChangedEventSubscriptionNext,
    };
  }
  return {
    useLatestDataChangedEvent: useLatestDataChangedEventReact,
    useDataChangedEvents: useDataChangedEventsReact,
    useInfiniteDataChangedEvents: useInfiniteDataChangedEventsReact,
    useDataChangedEventSubscription: useDataChangedEventSubscriptionReact,
  };
}

function buildFilter(vals: Record<string, string>): DataChangedEventFilter | undefined {
  const f: DataChangedEventFilter = {};
  if (vals.address) f.address = vals.address;
  if (vals.dataKey) f.dataKey = vals.dataKey;
  if (vals.dataKeyName) f.dataKeyName = DataKeyNameSchema.parse(vals.dataKeyName);
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

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<DataChangedEventSortField>('newest');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  );
  const universalProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const digitalAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
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

function DcIncludeSections({
  includeValues,
  toggleInclude,
  universalProfile,
  digitalAsset,
}: Pick<
  ReturnType<typeof useListState>,
  'includeValues' | 'toggleInclude' | 'universalProfile' | 'digitalAsset'
>): React.ReactNode {
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

function LatestTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useLatestDataChangedEvent } = useDataChangedHooks(mode);
  const { values, debouncedValues, setFieldValue } = useFilterFields(LATEST_FILTERS);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    DATA_CHANGED_EVENT_INCLUDE_FIELDS,
  );
  const universalProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const digitalAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const include = buildNestedInclude(includeValues, {
    universalProfile: universalProfile.value,
    digitalAsset: digitalAsset.value,
  });

  const { dataChangedEvent, isLoading, error, isFetching } = useLatestDataChangedEvent({
    filter,
    include,
  });

  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  return (
    <div className="space-y-4">
      <FilterFieldsRow configs={LATEST_FILTERS} values={values} onFieldChange={setFieldValue} />
      <DcIncludeSections
        includeValues={includeValues}
        toggleInclude={toggleInclude}
        universalProfile={universalProfile}
        digitalAsset={digitalAsset}
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
      {dataChangedEvent && (
        <div className={isFetching ? 'opacity-60' : undefined}>
          <DataChangedEventCard dataChangedEvent={dataChangedEvent} />
        </div>
      )}
      {hasActiveFilter && !isLoading && !error && !dataChangedEvent && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>No Event Found</AlertTitle>
          <AlertDescription>No data changed event matches the current filter.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDataChangedEvents } = useDataChangedHooks(mode);
  const state = useListState();
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
        <FilterFieldsRow configs={ROW1} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW2} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW3} values={state.values} onFieldChange={state.setFieldValue} />
      </div>
      <SortControls
        options={SORT_OPTIONS}
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
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
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

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteDataChangedEvents } = useDataChangedHooks(mode);
  const state = useListState();

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
        <FilterFieldsRow configs={ROW1} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW2} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW3} values={state.values} onFieldChange={state.setFieldValue} />
      </div>
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DataChangedEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
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

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDataChangedEventSubscription } = useDataChangedHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useDataChangedEventSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const dataChangedEvents = data ?? [];
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

      <div className="space-y-2">
        <FilterFieldsRow configs={ROW1} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW2} values={state.values} onFieldChange={state.setFieldValue} />
        <FilterFieldsRow configs={ROW3} values={state.values} onFieldChange={state.setFieldValue} />
      </div>
      <SortControls
        options={SORT_OPTIONS}
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
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <DcIncludeSections {...state} />
      <ResultsList
        items={dataChangedEvents}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(evt) => <DataChangedEventCard dataChangedEvent={evt} />}
        getKey={(evt) => `${evt.address}-${evt.dataKey}-${evt.dataValue.slice(0, 16)}`}
        label="data changed events"
        totalCount={dataChangedEvents.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

export default function DataChangedEventsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Data Changed Events"
      description={
        <>
          Exercise{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useLatestDataChangedEvent</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useDataChangedEvents</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteDataChangedEvents</code>
          , and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            useDataChangedEventSubscription
          </code>{' '}
          hooks against ERC725Y contract-level data change events via Hasura.
        </>
      }
      tabs={[
        {
          value: 'latest',
          label: 'Latest',
          icon: <Clock className="size-4" />,
          render: (mode) => <LatestTab mode={mode} />,
        },
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
