'use client';

import { Database, Hash, Loader2, Monitor, Server } from 'lucide-react';
import React, { useState } from 'react';

import {
  useDataChangedEvents as useDataChangedEventsNext,
  useInfiniteDataChangedEvents as useInfiniteDataChangedEventsNext,
} from '@lsp-indexer/next';
import {
  useDataChangedEvents as useDataChangedEventsReact,
  useInfiniteDataChangedEvents as useInfiniteDataChangedEventsReact,
} from '@lsp-indexer/react';
import type {
  DataChangedEvent,
  DataChangedFilter,
  DataChangedSort,
  DataChangedSortField,
  SortDirection,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { FilterFieldConfig, SortOption } from '@/components/playground';
import {
  FilterFieldsRow,
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
// Domain config
// ---------------------------------------------------------------------------

const DATA_CHANGED_FILTERS: FilterFieldConfig[] = [
  { key: 'contractAddress', label: 'Contract', placeholder: '0x... (ERC725 contract)', mono: true },
  { key: 'dataKey', label: 'Data Key', placeholder: '0x... (ERC725 key)', mono: true },
  { key: 'blockNumberMin', label: 'From Block', placeholder: 'e.g. 1000000' },
  { key: 'blockNumberMax', label: 'To Block', placeholder: 'e.g. 2000000' },
];

const DATA_CHANGED_SORT_OPTIONS: SortOption[] = [
  { value: 'blockNumber', label: 'Block Number' },
  { value: 'contractAddress', label: 'Contract' },
  { value: 'dataKey', label: 'Data Key' },
];

/** Build a DataChangedFilter from debounced filter field values */
function buildDataChangedFilter(
  debouncedValues: Record<string, string>,
): DataChangedFilter | undefined {
  const f: DataChangedFilter = {};
  if (debouncedValues.contractAddress) f.contractAddress = debouncedValues.contractAddress;
  if (debouncedValues.dataKey) f.dataKey = debouncedValues.dataKey;
  if (debouncedValues.blockNumberMin) {
    const parsed = Number(debouncedValues.blockNumberMin);
    if (!Number.isNaN(parsed)) f.blockNumberMin = parsed;
  }
  if (debouncedValues.blockNumberMax) {
    const parsed = Number(debouncedValues.blockNumberMax);
    if (!Number.isNaN(parsed)) f.blockNumberMax = parsed;
  }
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Domain card component
// ---------------------------------------------------------------------------

function DataChangedEventCard({ event }: { event: DataChangedEvent }): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="size-4 text-muted-foreground" />
          <Badge variant="secondary" className="font-mono text-xs">
            Block {event.blockNumber}
          </Badge>
          {event.timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(event.timestamp).toLocaleString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-20 shrink-0">Contract:</span>
            <code className="font-mono text-xs truncate">{event.address}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-20 shrink-0">Data Key:</span>
            <code className="font-mono text-xs truncate">{event.dataKey}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-20 shrink-0">Data Value:</span>
            <code className="font-mono text-xs truncate">
              {event.dataValue || <span className="italic text-muted-foreground">empty</span>}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-20 shrink-0">Log Index:</span>
            <span className="text-xs">{event.logIndex}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useDataChangedListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(DATA_CHANGED_FILTERS);
  const [sortField, setSortField] = useState<DataChangedSortField>('blockNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filter = buildDataChangedFilter(debouncedValues);
  const sort: DataChangedSort = { field: sortField, direction: sortDirection };
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

function DataChangedListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDataChangedEvents } = useHooks(mode);
  const state = useDataChangedListState();
  const [limit, setLimit] = useState(10);

  const { events, totalCount, isLoading, error, isFetching } = useDataChangedEvents({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={DATA_CHANGED_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={DATA_CHANGED_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DataChangedSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<DataChangedEvent>
        items={events}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(event) => <DataChangedEventCard event={event} />}
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
  const { useInfiniteDataChangedEvents } = useHooks(mode);
  const state = useDataChangedListState();

  const { events, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteDataChangedEvents({
      filter: state.filter,
      sort: state.sort,
      pageSize: 10,
    });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={DATA_CHANGED_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={DATA_CHANGED_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DataChangedSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<DataChangedEvent>
        items={events}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(event) => <DataChangedEventCard event={event} />}
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

export default function DataChangedPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Changed Events</h1>
          <p className="text-muted-foreground">
            Exercise{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useDataChangedEvents</code> and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              useInfiniteDataChangedEvents
            </code>{' '}
            hooks for ERC725 data change events.
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
            <Hash className="size-4" />
            Event List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <DataChangedListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
