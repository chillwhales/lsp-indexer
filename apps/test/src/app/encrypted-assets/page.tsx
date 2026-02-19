'use client';

import { FileKey, Loader2, Lock, Monitor, Search, Server } from 'lucide-react';
import React, { useState } from 'react';

import {
  useEncryptedAsset as useEncryptedAssetNext,
  useEncryptedAssets as useEncryptedAssetsNext,
  useInfiniteEncryptedAssets as useInfiniteEncryptedAssetsNext,
} from '@lsp-indexer/next';
import {
  useEncryptedAsset as useEncryptedAssetReact,
  useEncryptedAssets as useEncryptedAssetsReact,
  useInfiniteEncryptedAssets as useInfiniteEncryptedAssetsReact,
} from '@lsp-indexer/react';
import type {
  EncryptedAsset,
  EncryptedAssetFilter,
  EncryptedAssetSort,
  EncryptedAssetSortField,
  SortDirection,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { FilterFieldConfig, SortOption } from '@/components/playground';
import {
  ErrorAlert,
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

/** Returns the correct hook set based on the current mode */
function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useEncryptedAsset: useEncryptedAssetNext,
      useEncryptedAssets: useEncryptedAssetsNext,
      useInfiniteEncryptedAssets: useInfiniteEncryptedAssetsNext,
    };
  }
  return {
    useEncryptedAsset: useEncryptedAssetReact,
    useEncryptedAssets: useEncryptedAssetsReact,
    useInfiniteEncryptedAssets: useInfiniteEncryptedAssetsReact,
  };
}

// ---------------------------------------------------------------------------
// Encrypted Assets domain config
// ---------------------------------------------------------------------------

const ENCRYPTED_ASSET_FILTERS: FilterFieldConfig[] = [
  { key: 'title', label: 'Title', placeholder: 'Search by title...' },
  { key: 'ownerAddress', label: 'Owner', placeholder: '0x... (owner address)', mono: true },
];

const ENCRYPTED_ASSET_SORT_OPTIONS: SortOption[] = [
  { value: 'title', label: 'Title' },
  { value: 'timestamp', label: 'Timestamp' },
];

/** Build an EncryptedAssetFilter from debounced filter field values */
function buildEncryptedAssetFilter(
  debouncedValues: Record<string, string>,
): EncryptedAssetFilter | undefined {
  const f: EncryptedAssetFilter = {};
  if (debouncedValues.title) f.title = debouncedValues.title;
  if (debouncedValues.ownerAddress) f.ownerAddress = debouncedValues.ownerAddress;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Encrypted Asset card component
// ---------------------------------------------------------------------------

function EncryptedAssetCard({ asset }: { asset: EncryptedAsset }): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="size-4 text-muted-foreground" />
          {asset.title ?? 'Untitled Asset'}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate">{asset.address}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {asset.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{asset.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {asset.version && (
            <Badge variant="secondary" className="text-xs">
              v{asset.version}
            </Badge>
          )}
          {asset.encryptionMethod && (
            <Badge variant="secondary" className="text-xs">
              <Lock className="size-3" />
              {asset.encryptionMethod}
            </Badge>
          )}
          {asset.fileType && (
            <Badge variant="outline" className="text-xs">
              {asset.fileType}
            </Badge>
          )}
          {asset.imageCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {asset.imageCount} image{asset.imageCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {!asset.isDataFetched && (
            <Badge variant="destructive" className="text-xs">
              Not fetched
            </Badge>
          )}
        </div>
        {asset.ownerAddress && (
          <div className="text-xs text-muted-foreground">
            Owner:{' '}
            <span className="font-mono">
              {asset.ownerAddress.slice(0, 10)}…{asset.ownerAddress.slice(-8)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useEncryptedAssetListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ENCRYPTED_ASSET_FILTERS);
  const [sortField, setSortField] = useState<EncryptedAssetSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filter = buildEncryptedAssetFilter(debouncedValues);
  const sort: EncryptedAssetSort = { field: sortField, direction: sortDirection };
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
// Tab 1: Single Encrypted Asset
// ---------------------------------------------------------------------------

function SingleEncryptedAssetTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useEncryptedAsset } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');

  const { encryptedAsset, isLoading, error, isFetching } = useEncryptedAsset({
    address: queryAddress,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryAddress(address);
  };

  return (
    <div className="space-y-4">
      {/* Address input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Enter encrypted asset address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
        <Button type="submit" disabled={!address}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardHeader>
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </CardHeader>
        </Card>
      )}

      {/* Error state */}
      {error && <ErrorAlert error={error} />}

      {/* Success state */}
      {encryptedAsset && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="size-5 text-muted-foreground" />
                  {encryptedAsset.title ?? 'Untitled Asset'}
                  {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-1">
                  {encryptedAsset.address}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {encryptedAsset.isDataFetched ? (
                  <Badge variant="default" className="text-xs">
                    Fetched
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Not fetched
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {encryptedAsset.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{encryptedAsset.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Version:</span>{' '}
                {encryptedAsset.version ?? 'N/A'}
              </div>
              <div>
                <span className="text-muted-foreground">Content ID:</span>{' '}
                <span className="font-mono text-xs">
                  {encryptedAsset.contentId ? `${encryptedAsset.contentId.slice(0, 16)}…` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Encryption:</span>{' '}
                {encryptedAsset.encryptionMethod ?? 'None'}
              </div>
              <div>
                <span className="text-muted-foreground">Images:</span>{' '}
                <Badge variant="outline" className="text-xs">
                  {encryptedAsset.imageCount} image{encryptedAsset.imageCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            {(encryptedAsset.fileName ||
              encryptedAsset.fileType ||
              encryptedAsset.fileSize != null) && (
              <div>
                <h4 className="text-sm font-medium mb-1">File Info</h4>
                <div className="flex flex-wrap gap-2 text-sm">
                  {encryptedAsset.fileName && (
                    <Badge variant="secondary" className="text-xs">
                      <FileKey className="size-3" />
                      {encryptedAsset.fileName}
                    </Badge>
                  )}
                  {encryptedAsset.fileType && (
                    <Badge variant="outline" className="text-xs">
                      {encryptedAsset.fileType}
                    </Badge>
                  )}
                  {encryptedAsset.fileSize != null && (
                    <Badge variant="outline" className="text-xs">
                      {(encryptedAsset.fileSize / 1024).toFixed(1)} KB
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {encryptedAsset.ownerAddress && (
              <div>
                <span className="text-sm text-muted-foreground">Owner: </span>
                <span className="font-mono text-xs">{encryptedAsset.ownerAddress}</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Timestamp: {new Date(encryptedAsset.timestamp).toLocaleString()}
            </div>

            <RawJsonToggle data={encryptedAsset} label="encrypted asset" />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {queryAddress && !isLoading && !error && !encryptedAsset && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>No Encrypted Asset Found</AlertTitle>
          <AlertDescription>
            No LSP29 encrypted asset found at address{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Encrypted Asset List
// ---------------------------------------------------------------------------

function EncryptedAssetListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useEncryptedAssets } = useHooks(mode);
  const state = useEncryptedAssetListState();
  const [limit, setLimit] = useState(10);

  const { encryptedAssets, totalCount, isLoading, error, isFetching } = useEncryptedAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ENCRYPTED_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={ENCRYPTED_ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as EncryptedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<EncryptedAsset>
        items={encryptedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <EncryptedAssetCard asset={asset} />}
        getKey={(a) => a.id}
        label="encrypted assets"
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
  const { useInfiniteEncryptedAssets } = useHooks(mode);
  const state = useEncryptedAssetListState();

  const {
    encryptedAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteEncryptedAssets({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ENCRYPTED_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={ENCRYPTED_ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as EncryptedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<EncryptedAsset>
        items={encryptedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <EncryptedAssetCard asset={asset} />}
        getKey={(a) => a.id}
        label="encrypted assets"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EncryptedAssetsPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Encrypted Assets</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useEncryptedAsset</code>
            , <code className="text-xs bg-muted px-1 py-0.5 rounded">useEncryptedAssets</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteEncryptedAssets</code>{' '}
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
      <Tabs defaultValue="single" key={mode}>
        <TabsList>
          <TabsTrigger value="single">
            <Lock className="size-4" />
            Single Asset
          </TabsTrigger>
          <TabsTrigger value="list">
            <FileKey className="size-4" />
            Asset List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleEncryptedAssetTab mode={mode} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <EncryptedAssetListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
