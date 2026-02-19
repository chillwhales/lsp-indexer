'use client';

import { Coins, Hash, Loader2, Monitor, Server } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteOwnedAssets as useInfiniteOwnedAssetsNext,
  useInfiniteOwnedTokens as useInfiniteOwnedTokensNext,
  useOwnedAssets as useOwnedAssetsNext,
  useOwnedTokens as useOwnedTokensNext,
} from '@lsp-indexer/next';
import {
  useInfiniteOwnedAssets as useInfiniteOwnedAssetsReact,
  useInfiniteOwnedTokens as useInfiniteOwnedTokensReact,
  useOwnedAssets as useOwnedAssetsReact,
  useOwnedTokens as useOwnedTokensReact,
} from '@lsp-indexer/react';
import type {
  OwnedAsset,
  OwnedAssetFilter,
  OwnedAssetSortField,
  OwnedToken,
  OwnedTokenFilter,
  OwnedTokenSortField,
  SortDirection,
} from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

function useAssetHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useOwnedAssets: useOwnedAssetsNext,
      useInfiniteOwnedAssets: useInfiniteOwnedAssetsNext,
    };
  }
  return {
    useOwnedAssets: useOwnedAssetsReact,
    useInfiniteOwnedAssets: useInfiniteOwnedAssetsReact,
  };
}

function useTokenHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useOwnedTokens: useOwnedTokensNext,
      useInfiniteOwnedTokens: useInfiniteOwnedTokensNext,
    };
  }
  return {
    useOwnedTokens: useOwnedTokensReact,
    useInfiniteOwnedTokens: useInfiniteOwnedTokensReact,
  };
}

// ---------------------------------------------------------------------------
// Domain configs
// ---------------------------------------------------------------------------

const ASSET_FILTERS: FilterFieldConfig[] = [
  { key: 'ownerAddress', label: 'Owner', placeholder: '0x... (UP address)', mono: true },
  { key: 'assetAddress', label: 'Asset', placeholder: '0x... (token contract)', mono: true },
];

const TOKEN_FILTERS: FilterFieldConfig[] = [
  { key: 'ownerAddress', label: 'Owner', placeholder: '0x... (UP address)', mono: true },
  {
    key: 'assetAddress',
    label: 'Collection',
    placeholder: '0x... (collection contract)',
    mono: true,
  },
  { key: 'tokenId', label: 'Token ID', placeholder: 'e.g. 0x0001...', mono: true },
];

const ASSET_SORT_OPTIONS: SortOption[] = [
  { value: 'assetAddress', label: 'Asset Address' },
  { value: 'balance', label: 'Balance' },
];

const TOKEN_SORT_OPTIONS: SortOption[] = [
  { value: 'assetAddress', label: 'Asset Address' },
  { value: 'tokenId', label: 'Token ID' },
];

/** Build OwnedAssetFilter from debounced filter field values */
function buildAssetFilter(debouncedValues: Record<string, string>): OwnedAssetFilter | undefined {
  const f: OwnedAssetFilter = {};
  if (debouncedValues.ownerAddress) f.ownerAddress = debouncedValues.ownerAddress;
  if (debouncedValues.assetAddress) f.assetAddress = debouncedValues.assetAddress;
  return Object.keys(f).length > 0 ? f : undefined;
}

/** Build OwnedTokenFilter from debounced filter field values */
function buildTokenFilter(debouncedValues: Record<string, string>): OwnedTokenFilter | undefined {
  const f: OwnedTokenFilter = {};
  if (debouncedValues.ownerAddress) f.ownerAddress = debouncedValues.ownerAddress;
  if (debouncedValues.assetAddress) f.assetAddress = debouncedValues.assetAddress;
  if (debouncedValues.tokenId) f.tokenId = debouncedValues.tokenId;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared state hooks
// ---------------------------------------------------------------------------

function useAssetListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ASSET_FILTERS);
  const [sortField, setSortField] = useState<OwnedAssetSortField>('assetAddress');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filter = buildAssetFilter(debouncedValues);
  const sort = { field: sortField, direction: sortDirection } as const;
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

function useTokenListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(TOKEN_FILTERS);
  const [sortField, setSortField] = useState<OwnedTokenSortField>('assetAddress');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filter = buildTokenFilter(debouncedValues);
  const sort = { field: sortField, direction: sortDirection } as const;
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
// Domain card components
// ---------------------------------------------------------------------------

/** Truncate address for display */
function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function OwnedAssetCard({ asset }: { asset: OwnedAsset }): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="size-4 text-muted-foreground" />
          {asset.name ?? 'Unknown Asset'}
          {asset.symbol && (
            <Badge variant="secondary" className="text-xs">
              {asset.symbol}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate">
          Asset: {asset.assetAddress}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-mono text-xs">{truncateAddress(asset.ownerAddress)}</span>
        </div>
        {asset.balance != null && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-mono text-xs">{asset.balance}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OwnedTokenCard({ token }: { token: OwnedToken }): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Hash className="size-4 text-muted-foreground" />
          {token.name ?? 'Unknown Token'}
          {token.symbol && (
            <Badge variant="secondary" className="text-xs">
              {token.symbol}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate">
          Collection: {token.assetAddress}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-mono text-xs">{truncateAddress(token.ownerAddress)}</span>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">Token ID:</span>
          <span className="font-mono text-xs truncate max-w-xs">{token.tokenId}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Assets sub-tabs: List + Infinite Scroll
// ---------------------------------------------------------------------------

function AssetListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedAssets } = useAssetHooks(mode);
  const state = useAssetListState();
  const [limit, setLimit] = useState(10);

  const { ownedAssets, totalCount, isLoading, error, isFetching } = useOwnedAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<OwnedAsset>
        items={ownedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <OwnedAssetCard asset={asset} />}
        getKey={(a) => `${a.ownerAddress}-${a.assetAddress}`}
        label="owned assets"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

function AssetInfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteOwnedAssets } = useAssetHooks(mode);
  const state = useAssetListState();

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
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<OwnedAsset>
        items={ownedAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <OwnedAssetCard asset={asset} />}
        getKey={(a) => `${a.ownerAddress}-${a.assetAddress}`}
        label="owned assets"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tokens sub-tabs: List + Infinite Scroll
// ---------------------------------------------------------------------------

function TokenListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedTokens } = useTokenHooks(mode);
  const state = useTokenListState();
  const [limit, setLimit] = useState(10);

  const { ownedTokens, totalCount, isLoading, error, isFetching } = useOwnedTokens({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={TOKEN_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={TOKEN_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedTokenSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<OwnedToken>
        items={ownedTokens}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(token) => <OwnedTokenCard token={token} />}
        getKey={(t) => `${t.ownerAddress}-${t.assetAddress}-${t.tokenId}`}
        label="owned tokens"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

function TokenInfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteOwnedTokens } = useTokenHooks(mode);
  const state = useTokenListState();

  const {
    ownedTokens,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteOwnedTokens({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={TOKEN_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={TOKEN_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedTokenSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<OwnedToken>
        items={ownedTokens}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(token) => <OwnedTokenCard token={token} />}
        getKey={(t) => `${t.ownerAddress}-${t.assetAddress}-${t.tokenId}`}
        label="owned tokens"
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
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedAssets</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedTokens</code>, and their
            infinite scroll variants against live Hasura data.
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

      {/* Top-level tabs: Owned Assets vs Owned Tokens */}
      <Tabs defaultValue="assets" key={mode}>
        <TabsList>
          <TabsTrigger value="assets">
            <Coins className="size-4" />
            Owned Assets (LSP7)
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <Hash className="size-4" />
            Owned Tokens (LSP8)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="infinite">
                <Loader2 className="size-4" />
                Infinite Scroll
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <AssetListTab mode={mode} />
            </TabsContent>

            <TabsContent value="infinite" className="mt-4">
              <AssetInfiniteTab mode={mode} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="tokens" className="mt-4">
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="infinite">
                <Loader2 className="size-4" />
                Infinite Scroll
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <TokenListTab mode={mode} />
            </TabsContent>

            <TabsContent value="infinite" className="mt-4">
              <TokenInfiniteTab mode={mode} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
