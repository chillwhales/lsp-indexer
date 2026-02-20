'use client';

import { Gem, Infinity, Layers, Monitor, Search, Server } from 'lucide-react';
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
import type {
  Nft,
  NftFilter,
  NftInclude,
  NftSort,
  NftSortField,
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

import { NftCard } from '@/components/nft-card';
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
// NFT domain config
// ---------------------------------------------------------------------------

const NFT_FILTERS: FilterFieldConfig[] = [
  {
    key: 'collectionAddress',
    label: 'Collection Address',
    placeholder: '0x... (collection contract)',
    mono: true,
  },
  { key: 'tokenId', label: 'Token ID', placeholder: 'Token ID (hex or number)', mono: true },
  {
    key: 'formattedTokenId',
    label: 'Formatted Token ID',
    placeholder: 'Human-readable token ID',
    mono: true,
  },
  { key: 'name', label: 'NFT Name', placeholder: 'Search by name...' },
  {
    key: 'holderAddress',
    label: 'Holder Address',
    placeholder: '0x... (current holder)',
    mono: true,
  },
  {
    key: 'isBurned',
    label: 'Burned',
    placeholder: 'true or false',
    options: [
      { value: 'true', label: 'Burned' },
      { value: 'false', label: 'Not Burned' },
    ],
  },
  {
    key: 'isMinted',
    label: 'Minted',
    placeholder: 'true or false',
    options: [
      { value: 'true', label: 'Minted' },
      { value: 'false', label: 'Not Minted' },
    ],
  },
];

const NFT_SORT_OPTIONS: SortOption[] = [
  { value: 'tokenId', label: 'Token ID' },
  { value: 'formattedTokenId', label: 'Formatted Token ID' },
];

const NFT_INCLUDES: IncludeToggleConfig[] = [
  { key: 'formattedTokenId', label: 'Formatted Token ID' },
  { key: 'name', label: 'NFT Name' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'icons', label: 'Icons' },
  { key: 'images', label: 'Images' },
  { key: 'links', label: 'Links' },
  { key: 'attributes', label: 'Attributes' },
];

/** Holder sub-include toggle configs (ProfileInclude fields) */
const HOLDER_SUB_INCLUDES: IncludeToggleConfig[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'tags', label: 'Tags' },
  { key: 'links', label: 'Links' },
  { key: 'avatar', label: 'Avatar' },
  { key: 'profileImage', label: 'Profile Image' },
  { key: 'backgroundImage', label: 'Background Image' },
  { key: 'followerCount', label: 'Follower Count' },
  { key: 'followingCount', label: 'Following Count' },
];

/** Collection sub-include toggle configs (DigitalAssetInclude fields) */
const COLLECTION_SUB_INCLUDES: IncludeToggleConfig[] = [
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

const PRESET_COLLECTIONS = [
  { label: 'Chillwhales', address: '0x86E817172b5c07f7036Bf8aA46e2db9063743A83' },
] as const;

/** Build an NftFilter from debounced filter field values */
function buildNftFilter(debouncedValues: Record<string, string>): NftFilter | undefined {
  const f: NftFilter = {};
  if (debouncedValues.collectionAddress) f.collectionAddress = debouncedValues.collectionAddress;
  if (debouncedValues.tokenId) f.tokenId = debouncedValues.tokenId;
  if (debouncedValues.formattedTokenId) f.formattedTokenId = debouncedValues.formattedTokenId;
  if (debouncedValues.name) f.name = debouncedValues.name;
  if (debouncedValues.holderAddress) f.holderAddress = debouncedValues.holderAddress;
  if (debouncedValues.isBurned !== undefined && debouncedValues.isBurned !== '') {
    f.isBurned = debouncedValues.isBurned === 'true';
  }
  if (debouncedValues.isMinted !== undefined && debouncedValues.isMinted !== '') {
    f.isMinted = debouncedValues.isMinted === 'true';
  }
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Collection include hook — manages collection toggle + sub-toggles
// ---------------------------------------------------------------------------

/**
 * Hook for managing the collection include state with nested sub-includes.
 *
 * When collection is enabled (even without any sub-includes), it means
 * "include the collection data". The sub-toggles control which collection
 * fields to fetch.
 */
function useCollectionInclude() {
  const [enabled, setEnabled] = useState(true);
  const {
    values: subValues,
    toggle: toggleSub,
    include: subInclude,
  } = useIncludeToggles(COLLECTION_SUB_INCLUDES);

  return {
    enabled,
    setEnabled,
    subValues,
    toggleSub,
    /** Returns the collection include value for the NftInclude object */
    value: enabled ? (subInclude ?? {}) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Holder include hook — manages holder toggle + sub-toggles
// ---------------------------------------------------------------------------

/**
 * Hook for managing the holder include state with nested sub-includes.
 *
 * When holder is enabled (even without any sub-includes), it means
 * "include the holder data". The sub-toggles control which profile
 * fields to fetch for the holder's Universal Profile.
 */
function useHolderInclude() {
  const [enabled, setEnabled] = useState(true);
  const {
    values: subValues,
    toggle: toggleSub,
    include: subInclude,
  } = useIncludeToggles(HOLDER_SUB_INCLUDES);

  return {
    enabled,
    setEnabled,
    subValues,
    toggleSub,
    /** Returns the holder include value for the NftInclude object */
    value: enabled ? (subInclude ?? {}) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Build NftInclude from toggle state + collection/holder sub-includes
// ---------------------------------------------------------------------------

function buildNftInclude(
  includeValues: Record<string, boolean>,
  collectionValue: Record<string, boolean> | undefined,
  holderValue: Record<string, boolean> | undefined,
): NftInclude | undefined {
  // Check if all base toggles are ON, collection enabled with all sub-includes ON,
  // and holder enabled with all sub-includes ON
  const allBaseOn = Object.values(includeValues).every(Boolean);
  const collectionAllOn =
    collectionValue !== undefined && Object.keys(collectionValue).length === 0;
  const holderAllOn = holderValue !== undefined && Object.keys(holderValue).length === 0;

  if (allBaseOn && collectionAllOn && holderAllOn) return undefined; // Everything ON = use defaults

  const include: NftInclude = {};
  for (const [key, val] of Object.entries(includeValues)) {
    (include as Record<string, unknown>)[key] = val;
  }
  if (collectionValue !== undefined) {
    include.collection = collectionValue;
  }
  if (holderValue !== undefined) {
    include.holder = holderValue;
  }
  return include;
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useNftListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(NFT_FILTERS);
  const [sortField, setSortField] = useState<NftSortField>('tokenId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(NFT_INCLUDES);
  const collection = useCollectionInclude();
  const holder = useHolderInclude();

  const filter = buildNftFilter(debouncedValues);
  const sort: NftSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNftInclude(includeValues, collection.value, holder.value);

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
    collection,
    holder,
  };
}

// ---------------------------------------------------------------------------
// Collection sub-include toggles component
// ---------------------------------------------------------------------------

function CollectionIncludeSection({
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
          Collection
        </span>
      </label>
      {enabled && (
        <div className="ml-6 pl-3 border-l space-y-1">
          <span className="text-xs text-muted-foreground">Collection sub-fields</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {COLLECTION_SUB_INCLUDES.map((config) => (
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
// Holder sub-include toggles component
// ---------------------------------------------------------------------------

function HolderIncludeSection({
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
          Holder
        </span>
      </label>
      {enabled && (
        <div className="ml-6 pl-3 border-l space-y-1">
          <span className="text-xs text-muted-foreground">Holder profile sub-fields</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {HOLDER_SUB_INCLUDES.map((config) => (
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
// Tab 1: Single NFT
// ---------------------------------------------------------------------------

function SingleNftTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useNft } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [formattedTokenId, setFormattedTokenId] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [queryTokenId, setQueryTokenId] = useState('');
  const [queryFormattedTokenId, setQueryFormattedTokenId] = useState('');
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(NFT_INCLUDES);
  const collection = useCollectionInclude();
  const holder = useHolderInclude();
  const include = buildNftInclude(includeValues, collection.value, holder.value);

  const { nft, isLoading, error, isFetching } = useNft({
    address: queryAddress,
    tokenId: queryTokenId || undefined,
    formattedTokenId: queryFormattedTokenId || undefined,
    include,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryAddress(address);
    setQueryTokenId(tokenId);
    setQueryFormattedTokenId(formattedTokenId);
  };

  const handlePreset = (presetAddress: string) => {
    setAddress(presetAddress);
    setQueryAddress(presetAddress);
    // Keep tokenId / formattedTokenId as-is — user enters them separately
  };

  const canSubmit = Boolean(address && (tokenId || formattedTokenId));

  return (
    <div className="space-y-4">
      {/* Address + Token ID + Formatted Token ID inputs — stacked vertically */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="nft-address">Collection Address</Label>
          <Input
            id="nft-address"
            placeholder="0x... (collection contract)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nft-tokenid">Token ID</Label>
          <Input
            id="nft-tokenid"
            placeholder="Raw token ID (hex or number)"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nft-formatted-tokenid">Formatted Token ID</Label>
          <Input
            id="nft-formatted-tokenid"
            placeholder="Human-readable formatted token ID"
            value={formattedTokenId}
            onChange={(e) => setFormattedTokenId(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit" disabled={!canSubmit}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Presets:</span>
        {PRESET_COLLECTIONS.map((preset) => (
          <Button
            key={preset.address}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset.address)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Include toggles */}
      <IncludeToggles configs={NFT_INCLUDES} values={includeValues} onToggle={toggleInclude} />
      <HolderIncludeSection
        enabled={holder.enabled}
        setEnabled={holder.setEnabled}
        subValues={holder.subValues}
        toggleSub={holder.toggleSub}
      />
      <CollectionIncludeSection
        enabled={collection.enabled}
        setEnabled={collection.setEnabled}
        subValues={collection.subValues}
        toggleSub={collection.toggleSub}
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
      {nft && <NftCard nft={nft} isFetching={isFetching} />}

      {/* Empty state */}
      {queryAddress && (queryTokenId || queryFormattedTokenId) && !isLoading && !error && !nft && (
        <Alert>
          <Gem className="h-4 w-4" />
          <AlertTitle>No NFT Found</AlertTitle>
          <AlertDescription>
            No NFT found at collection{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
            {queryTokenId && (
              <>
                {' '}
                with token ID{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryTokenId}</code>
              </>
            )}
            {queryFormattedTokenId && (
              <>
                {' '}
                with formatted token ID{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {queryFormattedTokenId}
                </code>
              </>
            )}
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
    include: state.include,
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
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
        limit={limit}
        onLimitChange={setLimit}
      />
      <IncludeToggles
        configs={NFT_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <HolderIncludeSection
        enabled={state.holder.enabled}
        setEnabled={state.holder.setEnabled}
        subValues={state.holder.subValues}
        toggleSub={state.holder.toggleSub}
      />
      <CollectionIncludeSection
        enabled={state.collection.enabled}
        setEnabled={state.collection.setEnabled}
        subValues={state.collection.subValues}
        toggleSub={state.collection.toggleSub}
      />
      <ResultsList<Nft>
        items={nfts}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(nft) => <NftCard nft={nft} />}
        getKey={(n) => `${n.address}-${n.tokenId}`}
        label="NFTs"
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
      include: state.include,
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
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeToggles
        configs={NFT_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <HolderIncludeSection
        enabled={state.holder.enabled}
        setEnabled={state.holder.setEnabled}
        subValues={state.holder.subValues}
        toggleSub={state.holder.toggleSub}
      />
      <CollectionIncludeSection
        enabled={state.collection.enabled}
        setEnabled={state.collection.setEnabled}
        subValues={state.collection.subValues}
        toggleSub={state.collection.toggleSub}
      />
      <ResultsList<Nft>
        items={nfts}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(nft) => <NftCard nft={nft} />}
        getKey={(n) => `${n.address}-${n.tokenId}`}
        label="NFTs"
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
            against live Hasura data. Filter by collection address to exercise the{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useNftsByCollection</code>{' '}
            pattern (QUERY-03).
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
            <Layers className="size-4" />
            NFT List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Infinity className="size-4" />
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
