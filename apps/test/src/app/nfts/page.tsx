'use client';

import { Gem, Loader2, Monitor, Search, Server } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteNfts as useInfiniteNftsNext,
  useNft as useNftNext,
  useNfts as useNftsNext,
} from '@lsp-indexer/next';
import {
  useInfiniteNfts as useInfiniteNftsReact,
  useNft as useNftReact,
  useNfts as useNftsReact,
} from '@lsp-indexer/react';
import type { Nft, NftFilter, NftSortField, SortDirection } from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      useNft: useNftNext,
      useNfts: useNftsNext,
      useInfiniteNfts: useInfiniteNftsNext,
    };
  }
  return {
    useNft: useNftReact,
    useNfts: useNftsReact,
    useInfiniteNfts: useInfiniteNftsReact,
  };
}

// ---------------------------------------------------------------------------
// NFT domain config — the ONLY things that change per domain
// ---------------------------------------------------------------------------

const NFT_FILTERS: FilterFieldConfig[] = [
  {
    key: 'collectionAddress',
    label: 'Collection',
    placeholder: '0x... (collection address)',
    mono: true,
  },
  { key: 'ownerAddress', label: 'Owner', placeholder: '0x... (owner address)', mono: true },
  { key: 'tokenId', label: 'Token ID', placeholder: 'e.g. 0x0001...', mono: true },
];

const NFT_SORT_OPTIONS: SortOption[] = [
  { value: 'tokenId', label: 'Token ID' },
  { value: 'name', label: 'Name' },
];

/** Build an NftFilter from debounced filter field values */
function buildNftFilter(debouncedValues: Record<string, string>): NftFilter | undefined {
  const f: NftFilter = {};
  if (debouncedValues.collectionAddress) f.collectionAddress = debouncedValues.collectionAddress;
  if (debouncedValues.ownerAddress) f.ownerAddress = debouncedValues.ownerAddress;
  if (debouncedValues.tokenId) f.tokenId = debouncedValues.tokenId;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate an address to 0x1234...5678 format */
function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// NFT-specific components (domain card — varies per domain)
// ---------------------------------------------------------------------------

function NftCard({ nft }: { nft: Nft }): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gem className="size-4 text-muted-foreground" />
          {nft.name ?? 'Unnamed NFT'}
          {nft.symbol && (
            <Badge variant="secondary" className="text-xs">
              {nft.symbol}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate" title={nft.address}>
          Collection: {truncateAddress(nft.address)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground min-w-[70px]">Token ID:</span>
          <code
            className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
            title={nft.tokenId}
          >
            {nft.tokenId.length > 20 ? truncateAddress(nft.tokenId) : nft.tokenId}
          </code>
        </div>
        {nft.ownerAddress && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground min-w-[70px]">Owner:</span>
            <code
              className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate"
              title={nft.ownerAddress}
            >
              {truncateAddress(nft.ownerAddress)}
            </code>
          </div>
        )}
        <div className="flex gap-2">
          {nft.isMinted && (
            <Badge variant="outline" className="text-xs">
              Minted
            </Badge>
          )}
          {nft.isBurned && (
            <Badge variant="destructive" className="text-xs">
              Burned
            </Badge>
          )}
          {nft.baseUri && (
            <Badge variant="outline" className="text-xs">
              Has Base URI
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useNftListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(NFT_FILTERS);
  const [sortField, setSortField] = useState<NftSortField>('tokenId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filter = buildNftFilter(debouncedValues);
  const sort = { field: sortField, direction: sortDirection };
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
// Tab 1: Single NFT
// ---------------------------------------------------------------------------

function SingleNftTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useNft } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [queryTokenId, setQueryTokenId] = useState('');

  const { nft, isLoading, error, isFetching } = useNft({
    address: queryAddress,
    tokenId: queryTokenId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryAddress(address);
    setQueryTokenId(tokenId);
  };

  return (
    <div className="space-y-4">
      {/* Address + Token ID inputs */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="nft-address">Collection Address</Label>
          <Input
            id="nft-address"
            placeholder="0x... (collection contract address)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nft-token-id">Token ID</Label>
          <Input
            id="nft-token-id"
            placeholder="e.g. 0x0000000000000000000000000000000000000000000000000000000000000001"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit" disabled={!address || !tokenId}>
          <Search className="size-4" />
          Fetch NFT
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
      {nft && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="size-5 text-muted-foreground" />
                  {nft.name ?? 'Unnamed NFT'}
                  {nft.symbol && (
                    <Badge variant="secondary" className="text-xs">
                      {nft.symbol}
                    </Badge>
                  )}
                  {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-1">
                  Collection: {nft.address}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground min-w-[80px]">Token ID:</span>
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                  {nft.tokenId}
                </code>
              </div>
              {nft.tokenIdFormat && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground min-w-[80px]">Format:</span>
                  <span>{nft.tokenIdFormat}</span>
                </div>
              )}
              {nft.ownerAddress && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground min-w-[80px]">Owner:</span>
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    {nft.ownerAddress}
                  </code>
                </div>
              )}
              {nft.baseUri && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground min-w-[80px]">Base URI:</span>
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                    {nft.baseUri}
                  </code>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {nft.isMinted && (
                <Badge variant="outline" className="text-xs">
                  Minted
                </Badge>
              )}
              {nft.isBurned && (
                <Badge variant="destructive" className="text-xs">
                  Burned
                </Badge>
              )}
            </div>

            <RawJsonToggle data={nft} label="nft" />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {queryAddress && queryTokenId && !isLoading && !error && !nft && (
        <Alert>
          <Gem className="h-4 w-4" />
          <AlertTitle>No NFT Found</AlertTitle>
          <AlertDescription>
            No NFT found at collection{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code> with token
            ID <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryTokenId}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: NFT List
// ---------------------------------------------------------------------------

function NftListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useNfts } = useHooks(mode);
  const state = useNftListState();
  const [limit, setLimit] = useState(10);

  const { nfts, totalCount, isLoading, error, isFetching } = useNfts({
    filter: state.filter,
    sort: state.sort,
    limit,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={NFT_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={NFT_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as NftSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <ResultsList<Nft>
        items={nfts}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(nft) => <NftCard nft={nft} />}
        getKey={(nft) => `${nft.address}-${nft.tokenId}`}
        label="nfts"
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
  const { useInfiniteNfts } = useHooks(mode);
  const state = useNftListState();

  const { nfts, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, error, isFetching } =
    useInfiniteNfts({
      filter: state.filter,
      sort: state.sort,
      pageSize: 10,
    });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={NFT_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={NFT_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as NftSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <ResultsList<Nft>
        items={nfts}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(nft) => <NftCard nft={nft} />}
        getKey={(nft) => `${nft.address}-${nft.tokenId}`}
        label="nfts"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NftsPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NFTs</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useNft</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useNfts</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteNfts</code> hooks
            against live Hasura data.
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
            <Gem className="size-4" />
            Single NFT
          </TabsTrigger>
          <TabsTrigger value="list">
            <Gem className="size-4" />
            NFT List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Loader2 className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleNftTab mode={mode} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <NftListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
