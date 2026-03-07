'use client';

/** Universal Receiver Events playground — LSP1 events with 3 nested relations. */
import { TYPE_ID_NAMES, TypeIdNameSchema } from '@chillwhales/lsp1';
import { InfinityIcon, List, Radio, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteUniversalReceiverEvents as useInfiniteUniversalReceiverEventsNext,
  useUniversalReceiverEvents as useUniversalReceiverEventsNext,
  useUniversalReceiverEventSubscription as useUniversalReceiverEventSubscriptionNext,
} from '@lsp-indexer/next';
import {
  useInfiniteUniversalReceiverEvents as useInfiniteUniversalReceiverEventsReact,
  useUniversalReceiverEvents as useUniversalReceiverEventsReact,
  useUniversalReceiverEventSubscription as useUniversalReceiverEventSubscriptionReact,
} from '@lsp-indexer/react';
import {
  type SortDirection,
  type SortNulls,
  type UniversalReceiverEventFilter,
  type UniversalReceiverEventSort,
  type UniversalReceiverEventSortField,
} from '@lsp-indexer/types';

import {
  type FilterFieldConfig,
  type HookMode,
  type SortOption,
  buildNestedInclude,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  FilterFieldsRow,
  IncludeToggles,
  PlaygroundPageLayout,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  SubIncludeSection,
  UNIVERSAL_RECEIVER_EVENT_INCLUDE_FIELDS,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UniversalReceiverEventCard } from '@/components/universal-receiver-event-card';

/** Type ID name options for select dropdowns — built from the data-keys registry */
const TYPE_ID_NAME_OPTIONS = TYPE_ID_NAMES.map((name) => ({ value: name, label: name }));

const ALL_FILTERS: FilterFieldConfig[] = [
  {
    key: 'address',
    label: 'Receiver Address',
    placeholder: '0x... (receiving address)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'from',
    label: 'From Address',
    placeholder: '0x... (sender address)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'typeId',
    label: 'Type ID',
    placeholder: '0x... (LSP1 type identifier)',
    mono: true,
    width: 'w-80',
  },
  {
    key: 'typeIdName',
    label: 'Type ID Name',
    placeholder: 'All Type IDs',
    options: TYPE_ID_NAME_OPTIONS,
    width: 'w-72',
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
    label: 'Receiver Profile Name',
    placeholder: 'Search receiver name...',
    width: 'w-64',
  },
  {
    key: 'fromProfileName',
    label: 'Sender Profile Name',
    placeholder: 'Search sender name...',
    width: 'w-64',
  },
  {
    key: 'fromAssetName',
    label: 'Sender Asset Name',
    placeholder: 'Search asset name...',
    width: 'w-64',
  },
];

/** Filter groups rendered as separate rows */
const ROW1 = ALL_FILTERS.filter(
  (f) => f.key === 'address' || f.key === 'from' || f.key === 'typeId' || f.key === 'typeIdName',
);
const ROW2 = ALL_FILTERS.filter(
  (f) =>
    f.key === 'timestampFrom' ||
    f.key === 'timestampTo' ||
    f.key === 'blockNumberFrom' ||
    f.key === 'blockNumberTo',
);
const ROW3 = ALL_FILTERS.filter(
  (f) =>
    f.key === 'universalProfileName' || f.key === 'fromProfileName' || f.key === 'fromAssetName',
);

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'universalProfileName', label: 'Receiver Profile Name' },
  { value: 'fromProfileName', label: 'Sender Profile Name' },
  { value: 'fromAssetName', label: 'Sender Asset Name' },
];

type UniversalReceiverEventHooks = {
  useUniversalReceiverEvents: typeof useUniversalReceiverEventsReact;
  useInfiniteUniversalReceiverEvents: typeof useInfiniteUniversalReceiverEventsReact;
  useUniversalReceiverEventSubscription: typeof useUniversalReceiverEventSubscriptionReact;
};

function useUniversalReceiverEventHooks(mode: HookMode): UniversalReceiverEventHooks {
  if (mode === 'server') {
    return {
      useUniversalReceiverEvents: useUniversalReceiverEventsNext,
      useInfiniteUniversalReceiverEvents: useInfiniteUniversalReceiverEventsNext,
      useUniversalReceiverEventSubscription: useUniversalReceiverEventSubscriptionNext,
    };
  }
  return {
    useUniversalReceiverEvents: useUniversalReceiverEventsReact,
    useInfiniteUniversalReceiverEvents: useInfiniteUniversalReceiverEventsReact,
    useUniversalReceiverEventSubscription: useUniversalReceiverEventSubscriptionReact,
  };
}

function buildFilter(vals: Record<string, string>): UniversalReceiverEventFilter | undefined {
  const f: UniversalReceiverEventFilter = {};
  if (vals.address) f.address = vals.address;
  if (vals.from) f.from = vals.from;
  if (vals.typeId) f.typeId = vals.typeId;
  if (vals.typeIdName) f.typeIdName = TypeIdNameSchema.parse(vals.typeIdName);
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
  if (vals.fromProfileName) f.fromProfileName = vals.fromProfileName;
  if (vals.fromAssetName) f.fromAssetName = vals.fromAssetName;
  return Object.keys(f).length > 0 ? f : undefined;
}

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<UniversalReceiverEventSortField>('newest');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(
    UNIVERSAL_RECEIVER_EVENT_INCLUDE_FIELDS,
  );
  const universalProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const fromProfile = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const fromAsset = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: UniversalReceiverEventSort = {
    field: sortField,
    direction: sortDirection,
    nulls: sortNulls,
  };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  const include = buildNestedInclude(includeValues, {
    universalProfile: universalProfile.value,
    fromProfile: fromProfile.value,
    fromAsset: fromAsset.value,
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
    fromProfile,
    fromAsset,
  };
}

function UreIncludeSections({
  includeValues,
  toggleInclude,
  universalProfile,
  fromProfile,
  fromAsset,
}: Pick<
  ReturnType<typeof useListState>,
  'includeValues' | 'toggleInclude' | 'universalProfile' | 'fromProfile' | 'fromAsset'
>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={UNIVERSAL_RECEIVER_EVENT_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Receiving Profile"
        subtitle="Receiving UP sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={universalProfile}
      />
      <SubIncludeSection
        label="Sender Profile"
        subtitle="Sender UP sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={fromProfile}
      />
      <SubIncludeSection
        label="Sender Asset"
        subtitle="Sender DA sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={fromAsset}
      />
    </>
  );
}

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useUniversalReceiverEvents } = useUniversalReceiverEventHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { universalReceiverEvents, totalCount, isLoading, error, isFetching } =
    useUniversalReceiverEvents({
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
        onSortFieldChange={(v) => state.setSortField(v as UniversalReceiverEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <UreIncludeSections {...state} />
      <ResultsList
        items={universalReceiverEvents}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(evt) => <UniversalReceiverEventCard universalReceiverEvent={evt} />}
        getKey={(evt) => `${evt.address}-${evt.from}-${evt.typeId.slice(0, 16)}`}
        label="universal receiver events"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteUniversalReceiverEvents } = useUniversalReceiverEventHooks(mode);
  const state = useListState();

  const {
    universalReceiverEvents,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteUniversalReceiverEvents({
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
        onSortFieldChange={(v) => state.setSortField(v as UniversalReceiverEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <UreIncludeSections {...state} />
      <ResultsList
        items={universalReceiverEvents}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(evt) => <UniversalReceiverEventCard universalReceiverEvent={evt} />}
        getKey={(evt) => `${evt.address}-${evt.from}-${evt.typeId.slice(0, 16)}`}
        label="universal receiver events"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useUniversalReceiverEventSubscription } = useUniversalReceiverEventHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useUniversalReceiverEventSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const universalReceiverEvents = data ?? [];
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
        onSortFieldChange={(v) => state.setSortField(v as UniversalReceiverEventSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
        hideDirectionAndNulls={state.sortField === 'newest' || state.sortField === 'oldest'}
      />
      <UreIncludeSections {...state} />
      <ResultsList
        items={universalReceiverEvents}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(evt) => <UniversalReceiverEventCard universalReceiverEvent={evt} />}
        getKey={(evt) => `${evt.address}-${evt.from}-${evt.typeId.slice(0, 16)}`}
        label="universal receiver events"
        totalCount={universalReceiverEvents.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

export default function UniversalReceiverEventsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Universal Receiver Events"
      description={
        <>
          Exercise{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useUniversalReceiverEvents</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            useInfiniteUniversalReceiverEvents
          </code>
          , and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            useUniversalReceiverEventSubscription
          </code>{' '}
          hooks against the{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">universal_receiver</code> table via
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
