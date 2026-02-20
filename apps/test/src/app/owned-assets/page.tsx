'use client';

import { Infinity, Layers, Monitor, Search, Server, Wallet } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { OwnedAssetCard } from '@/components/owned-asset-card';
import type { FilterFieldConfig, IncludeToggleConfig, SortOption } from '@/components/playground';
import {
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  ResultsList,
  SortControls,
  useFilterFields,
  useIncludeToggles,
} from '@/components/playground';

// ---------------------------------------------------------------------------
// Hook mode — pick which package's hooks to use
// ---------------------------------------------------------------------------

type HookMode = 'client' | 'server';

/** Returns the correct hook set based on the current mode */
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

// ---------------------------------------------------------------------------
// Owned Assets domain config
// ---------------------------------------------------------------------------

const OWNED_ASSET_FILTERS: FilterFieldConfig[] = [
  { key: 'owner', label: 'Owner Address', placeholder: '0x... (owner)', mono: true },
  { key: 'address', label: 'Asset Address', placeholder: '0x... (asset contract)', mono: true },
  {
    key: 'digitalAssetId',
    label: 'Digital Asset ID',
    placeholder: 'Digital asset FK',
    mono: true,
  },
  {
    key: 'universalProfileId',
    label: 'Universal Profile ID',
    placeholder: 'Universal profile FK',
    mono: true,
  },
];

const OWNED_ASSET_SORT_OPTIONS: SortOption[] = [
  { value: 'balance', label: 'Balance' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'address', label: 'Address' },
  { value: 'owner', label: 'Owner' },
  { value: 'block', label: 'Block' },
  { value: 'digitalAssetName', label: 'Digital Asset Name' },
  { value: 'tokenIdCount', label: 'Token ID Count' },
];

const OWNED_ASSET_INCLUDES: IncludeToggleConfig[] = [
  { key: 'universalProfile', label: 'Universal Profile' },
  { key: 'tokenIdCount', label: 'Token ID Count' },
];

/** Digital asset sub-include toggle configs (DigitalAssetInclude fields) */
const DA_SUB_INCLUDES: IncludeToggleConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'tokenType', label: 'Token Type' },
  { key: 'decimals', label: 'Decimals' },
  { key: 'totalSupply', label: 'Total Supply' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'icons', label: 'Icons' },
  { key: 'images', label: 'Images' },
  { key: 'links', label: 'Links' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'owner', label: 'Owner' },
  { key: 'holderCount', label: 'Holder Count' },
  { key: 'creatorCount', label: 'Creator Count' },
  { key: 'referenceContract', label: 'Reference Contract' },
  { key: 'tokenIdFormat', label: 'Token ID Format' },
  { key: 'baseUri', label: 'Base URI' },
];

/** Build an OwnedAssetFilter from debounced filter field values */
function buildOwnedAssetFilter(
  debouncedValues: Record<string, string>,
): OwnedAssetFilter | undefined {
  const f: OwnedAssetFilter = {};
  if (debouncedValues.owner) f.owner = debouncedValues.owner;
  if (debouncedValues.address) f.address = debouncedValues.address;
  if (debouncedValues.digitalAssetId) f.digitalAssetId = debouncedValues.digitalAssetId;
  if (debouncedValues.universalProfileId) f.universalProfileId = debouncedValues.universalProfileId;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Digital asset include hook — manages digitalAsset toggle + sub-toggles
// ---------------------------------------------------------------------------

/**
 * Hook for managing the digitalAsset include state with nested sub-includes.
 *
 * When digitalAsset is enabled (even without any sub-includes), it means
 * "include the digital asset data". The sub-toggles control which DA
 * fields to fetch.
 */
function useDigitalAssetInclude() {
  const [enabled, setEnabled] = useState(true);
  const {
    values: subValues,
    toggle: toggleSub,
    include: subInclude,
  } = useIncludeToggles(DA_SUB_INCLUDES);

  return {
    enabled,
    setEnabled,
    subValues,
    toggleSub,
    /** Returns the digitalAsset include value for the OwnedAssetInclude object */
    value: enabled ? (subInclude ?? {}) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Build OwnedAssetInclude from toggle state + DA sub-includes
// ---------------------------------------------------------------------------

function buildOwnedAssetInclude(
  includeValues: Record<string, boolean>,
  daValue: Record<string, boolean> | undefined,
): OwnedAssetInclude | undefined {
  // Check if all base toggles are ON and DA is enabled with all sub-includes ON
  const allBaseOn = Object.values(includeValues).every(Boolean);
  const daAllOn = daValue !== undefined && Object.keys(daValue).length === 0;

  if (allBaseOn && daAllOn) return undefined; // Everything ON = use defaults

  const include: OwnedAssetInclude = {};
  for (const [key, val] of Object.entries(includeValues)) {
    (include as Record<string, unknown>)[key] = val;
  }
  if (daValue !== undefined) {
    include.digitalAsset = daValue;
  }
  return include;
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useOwnedAssetListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(OWNED_ASSET_FILTERS);
  const [sortField, setSortField] = useState<OwnedAssetSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(OWNED_ASSET_INCLUDES);
  const da = useDigitalAssetInclude();

  const filter = buildOwnedAssetFilter(debouncedValues);
  const sort: OwnedAssetSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildOwnedAssetInclude(includeValues, da.value);

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
  };
}

// ---------------------------------------------------------------------------
// Digital asset sub-include toggles component
// ---------------------------------------------------------------------------

function DigitalAssetIncludeSection({
  enabled,
  setEnabled,
  subValues,
  toggleSub,
}: {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  subValues: Record<string, boolean>;
  toggleSub: (key: string) => void;
}): React.ReactNode {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
        <Switch size="sm" checked={enabled} onCheckedChange={setEnabled} />
        <span className={enabled ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          Digital Asset
        </span>
      </label>
      {enabled && (
        <div className="ml-6 pl-3 border-l space-y-1">
          <span className="text-xs text-muted-foreground">Digital asset sub-fields</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {DA_SUB_INCLUDES.map((config) => (
              <label
                key={config.key}
                className="flex items-center gap-1 text-xs cursor-pointer select-none"
              >
                <Switch
                  size="sm"
                  checked={subValues[config.key] ?? true}
                  onCheckedChange={() => toggleSub(config.key)}
                />
                <span
                  className={subValues[config.key] ? 'text-foreground' : 'text-muted-foreground'}
                >
                  {config.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Single Owned Asset
// ---------------------------------------------------------------------------

function SingleOwnedAssetTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedAsset } = useHooks(mode);
  const [id, setId] = useState('');
  const [queryId, setQueryId] = useState('');
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(OWNED_ASSET_INCLUDES);
  const da = useDigitalAssetInclude();
  const include = buildOwnedAssetInclude(includeValues, da.value);

  const { ownedAsset, isLoading, error, isFetching } = useOwnedAsset({
    id: queryId,
    include,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryId(id);
  };

  return (
    <div className="space-y-4">
      {/* ID input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="owned-asset-id">Owned Asset ID</Label>
          <Input
            id="owned-asset-id"
            placeholder="Enter owned asset unique ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit" disabled={!id}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      {/* Include toggles */}
      <IncludeToggles
        configs={OWNED_ASSET_INCLUDES}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <DigitalAssetIncludeSection
        enabled={da.enabled}
        setEnabled={da.setEnabled}
        subValues={da.subValues}
        toggleSub={da.toggleSub}
      />

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
        </Card>
      )}

      {/* Error state */}
      {error && <ErrorAlert error={error} />}

      {/* Success state */}
      {ownedAsset && <OwnedAssetCard ownedAsset={ownedAsset} isFetching={isFetching} />}

      {/* Empty state */}
      {queryId && !isLoading && !error && !ownedAsset && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertTitle>No Owned Asset Found</AlertTitle>
          <AlertDescription>
            No owned asset found with ID{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryId}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Owned Asset List
// ---------------------------------------------------------------------------

function OwnedAssetListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedAssets } = useHooks(mode);
  const state = useOwnedAssetListState();
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
        configs={OWNED_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={OWNED_ASSET_SORT_OPTIONS}
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
      <IncludeToggles
        configs={OWNED_ASSET_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <DigitalAssetIncludeSection
        enabled={state.da.enabled}
        setEnabled={state.da.setEnabled}
        subValues={state.da.subValues}
        toggleSub={state.da.toggleSub}
      />
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

function InfiniteScrollTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteOwnedAssets } = useHooks(mode);
  const state = useOwnedAssetListState();

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
        configs={OWNED_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={OWNED_ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeToggles
        configs={OWNED_ASSET_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <DigitalAssetIncludeSection
        enabled={state.da.enabled}
        setEnabled={state.da.setEnabled}
        subValues={state.da.subValues}
        toggleSub={state.da.toggleSub}
      />
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
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Owned Assets</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAsset</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAssets</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteOwnedAssets</code>{' '}
            hooks against live Hasura data. Filter by owner to find token balances for a specific
            address (QUERY-04).
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
      <Tabs defaultValue="single" key={mode}>
        <TabsList>
          <TabsTrigger value="single">
            <Wallet className="size-4" />
            Single Lookup
          </TabsTrigger>
          <TabsTrigger value="list">
            <Layers className="size-4" />
            Owned Asset List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Infinity className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleOwnedAssetTab mode={mode} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <OwnedAssetListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
