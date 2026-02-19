'use client';

import { ArrowDown, Loader2, Monitor, Radio, Server } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteUniversalReceiverEvents as useInfiniteUniversalReceiverEventsNext,
  useUniversalReceiverEvents as useUniversalReceiverEventsNext,
} from '@lsp-indexer/next';
import {
  useInfiniteUniversalReceiverEvents as useInfiniteUniversalReceiverEventsReact,
  useUniversalReceiverEvents as useUniversalReceiverEventsReact,
} from '@lsp-indexer/react';
import type {
  SortDirection,
  UniversalReceiverEvent,
  UniversalReceiverFilter,
  UniversalReceiverSort,
  UniversalReceiverSortField,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { FilterFieldConfig, SortOption } from '@/components/playground';
import {
  FilterFieldsRow,
  RawJsonToggle,
  ResultsList,
  SortControls,
  useFilterFields,
} from '@/components/playground';

// ---------------------------------------------------------------------------
// Hook mode — pick which package's hooks to use
// ---------------------------------------------------------------------------

type HookMode = 'client' | 'server';

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useUniversalReceiverEvents: useUniversalReceiverEventsNext,
      useInfiniteUniversalReceiverEvents: useInfiniteUniversalReceiverEventsNext,
    };
  }
  return {
    useUniversalReceiverEvents: useUniversalReceiverEventsReact,
    useInfiniteUniversalReceiverEvents: useInfiniteUniversalReceiverEventsReact,
  };
}

// ---------------------------------------------------------------------------
// Universal Receiver domain config
// ---------------------------------------------------------------------------

const UR_FILTERS: FilterFieldConfig[] = [
  { key: 'receiverAddress', label: 'Receiver', placeholder: '0x... (UP address)', mono: true },
  { key: 'from', label: 'From', placeholder: '0x... (sender address)', mono: true },
  { key: 'typeId', label: 'Type ID', placeholder: '0x... (LSP type hash)', mono: true },
  { key: 'blockNumberMin', label: 'From Block', placeholder: 'e.g. 1000000' },
  { key: 'blockNumberMax', label: 'To Block', placeholder: 'e.g. 2000000' },
];

const UR_SORT_OPTIONS: SortOption[] = [
  { value: 'blockNumber', label: 'Block Number' },
  { value: 'receiverAddress', label: 'Receiver' },
  { value: 'typeId', label: 'Type ID' },
];

/** Truncate a hex string for display */
function truncateHex(hex: string, chars = 8): string {
  if (hex.length <= chars * 2 + 2) return hex;
  return `${hex.slice(0, chars + 2)}...${hex.slice(-chars)}`;
}

/** Build an UniversalReceiverFilter from debounced filter field values */
function buildURFilter(
  debouncedValues: Record<string, string>,
): UniversalReceiverFilter | undefined {
  const f: UniversalReceiverFilter = {};
  if (debouncedValues.receiverAddress) f.receiverAddress = debouncedValues.receiverAddress;
  if (debouncedValues.from) f.from = debouncedValues.from;
  if (debouncedValues.typeId) f.typeId = debouncedValues.typeId;
  if (debouncedValues.blockNumberMin) {
    const parsed = parseInt(debouncedValues.blockNumberMin, 10);
    if (!isNaN(parsed)) f.blockNumberMin = parsed;
  }
  if (debouncedValues.blockNumberMax) {
    const parsed = parseInt(debouncedValues.blockNumberMax, 10);
    if (!isNaN(parsed)) f.blockNumberMax = parsed;
  }
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Event Card
// ---------------------------------------------------------------------------

function UniversalReceiverEventCard({ event }: { event: UniversalReceiverEvent }): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="size-4 text-muted-foreground" />
            <Badge variant="secondary">Block {event.blockNumber}</Badge>
          </CardTitle>
          {event.timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(event.timestamp).toLocaleString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Receiver:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {truncateHex(event.address)}
            </code>
          </div>
          <div>
            <span className="text-muted-foreground">From:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{truncateHex(event.from)}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Type ID:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {truncateHex(event.typeId)}
            </code>
          </div>
          <div>
            <span className="text-muted-foreground">Tx Hash:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {event.id ? truncateHex(event.id) : 'N/A'}
            </code>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Received Data:</span>{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {event.receivedData ? truncateHex(event.receivedData, 16) : 'empty'}
          </code>
        </div>
        {event.value !== '0' && (
          <div>
            <span className="text-muted-foreground">Value:</span>{' '}
            <Badge variant="outline">{event.value}</Badge>
          </div>
        )}
        <RawJsonToggle data={event} label="event" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useURListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(UR_FILTERS);
  const [sortField, setSortField] = useState<UniversalReceiverSortField>('blockNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filter = buildURFilter(debouncedValues);
  const sort: UniversalReceiverSort = { field: sortField, direction: sortDirection };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);

  return {
    values,
    setFieldValue,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    filter,
    sort,
    hasActiveFilter,
  };
}

// ---------------------------------------------------------------------------
// Tab 1: Event List
// ---------------------------------------------------------------------------

function EventListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useUniversalReceiverEvents } = useHooks(mode);
  const state = useURListState();
  const [limit, setLimit] = useState(10);

  const { events, totalCount, isLoading, error, isFetching } = useUniversalReceiverEvents({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={UR_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={UR_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as UniversalReceiverSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<UniversalReceiverEvent>
        items={events}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(event) => <UniversalReceiverEventCard event={event} />}
        getKey={(e) => e.id}
        label="events"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Infinite Scroll
// ---------------------------------------------------------------------------

function InfiniteScrollTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteUniversalReceiverEvents } = useHooks(mode);
  const state = useURListState();

  const { events, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteUniversalReceiverEvents({
      filter: state.filter,
      sort: state.sort,
      pageSize: 10,
    });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={UR_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={UR_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as UniversalReceiverSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<UniversalReceiverEvent>
        items={events}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(event) => <UniversalReceiverEventCard event={event} />}
        getKey={(e) => e.id}
        label="events"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function UniversalReceiverPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Universal Receiver Events</h1>
          <p className="text-muted-foreground">
            Exercise{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useUniversalReceiverEvents</code>{' '}
            and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              useInfiniteUniversalReceiverEvents
            </code>{' '}
            hooks against live Hasura data.
          </p>
        </div>

        {/* Client / Server mode toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={mode === 'client' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('client')}
            className="gap-1.5"
          >
            <Monitor className="size-3.5" />
            Client
          </Button>
          <Button
            variant={mode === 'server' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('server')}
            className="gap-1.5"
          >
            <Server className="size-3.5" />
            Server
          </Button>
        </div>
      </div>

      {/* Mode indicator */}
      <div className="flex items-center gap-2">
        <Badge variant={mode === 'client' ? 'default' : 'secondary'}>
          {mode === 'client' ? '@lsp-indexer/react' : '@lsp-indexer/next'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {mode === 'client' ? 'Browser → Hasura directly' : 'Browser → Server Action → Hasura'}
        </span>
      </div>

      {/* key={mode} forces full remount when switching — avoids hook-rule violations */}
      <Tabs defaultValue="list" key={mode}>
        <TabsList>
          <TabsTrigger value="list">
            <ArrowDown className="size-4" />
            Event List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <EventListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
