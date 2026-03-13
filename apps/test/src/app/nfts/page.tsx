'use client';

/** NFTs playground — composite key lookup (address+tokenId), list, infinite scroll, and subscriptions. */
import { Gem, InfinityIcon, Layers, Radio, Search, Wifi, WifiOff } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteNfts as useInfiniteNftsNext,
  useNft as useNftNext,
  useNfts as useNftsNext,
  useNftSubscription as useNftSubscriptionNext,
} from '@lsp-indexer/next';
import {
  useInfiniteNfts as useInfiniteNftsReact,
  useNft as useNftReact,
  useNfts as useNftsReact,
  useNftSubscription as useNftSubscriptionReact,
} from '@lsp-indexer/react';
import {
  type NftFilter,
  type NftSort,
  type NftSortField,
  type SortDirection,
  type SortNulls,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

import { NftCard } from '@/components/nft-card';
import {
  type FilterFieldConfig,
  type HookMode,
  type SortOption,
  buildNestedInclude,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  NFT_INCLUDE_FIELDS,
  PlaygroundPageLayout,
  PresetButtons,
  PROFILE_INCLUDE_FIELDS,
  ResultsList,
  SortControls,
  SubIncludeSection,
  useFilterFields,
  useIncludeToggles,
  useSubInclude,
} from '@/components/playground';

const FILTERS: FilterFieldConfig[] = [
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

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'tokenId', label: 'Token ID' },
  { value: 'formattedTokenId', label: 'Formatted Token ID' },
];

const PRESETS = [
  {
    label: 'Chillwhale #1',
    address: '0x86E817172b5c07f7036Bf8aA46e2db9063743A83',
    tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  },
  {
    label: 'B.A.D. #1',
    address: '0x6edbbce5eba138de468eb0901ed2cf602bf473c9',
    tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  },
] as const;

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useNft: useNftNext,
      useNfts: useNftsNext,
      useInfiniteNfts: useInfiniteNftsNext,
      useNftSubscription: useNftSubscriptionNext,
    };
  }
  return {
    useNft: useNftReact,
    useNfts: useNftsReact,
    useInfiniteNfts: useInfiniteNftsReact,
    useNftSubscription: useNftSubscriptionReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): NftFilter | undefined {
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

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(FILTERS);
  const [sortField, setSortField] = useState<NftSortField>('newest');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(NFT_INCLUDE_FIELDS);
  const collection = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const holder = useSubInclude(PROFILE_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: NftSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNestedInclude(includeValues, {
    collection: collection.value,
    holder: holder.value,
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
    collection,
    holder,
  };
}

function IncludeSections({
  includeValues,
  toggleInclude,
  collection,
  holder,
}: ReturnType<typeof useListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles
        configs={NFT_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Holder"
        subtitle="Holder profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={holder}
      />
      <SubIncludeSection
        label="Collection"
        subtitle="Collection sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={collection}
      />
    </>
  );
}

function SingleTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useNft } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [formattedTokenId, setFormattedTokenId] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [queryTokenId, setQueryTokenId] = useState('');
  const [queryFormattedTokenId, setQueryFormattedTokenId] = useState('');
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(NFT_INCLUDE_FIELDS);
  const collection = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const holder = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const include = buildNestedInclude(includeValues, {
    collection: collection.value,
    holder: holder.value,
  });

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

  const canSubmit = Boolean(address && (tokenId || formattedTokenId));

  return (
    <div className="space-y-4">
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

      <PresetButtons
        presets={PRESETS}
        onSelect={(p) => {
          setAddress(p.address);
          setTokenId(p.tokenId);
          setFormattedTokenId('');
          setQueryAddress(p.address);
          setQueryTokenId(p.tokenId);
          setQueryFormattedTokenId('');
        }}
      />

      <IncludeToggles
        configs={NFT_INCLUDE_FIELDS}
        values={includeValues}
        onToggle={toggleInclude}
      />
      <SubIncludeSection
        label="Holder"
        subtitle="Holder profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={holder}
      />
      <SubIncludeSection
        label="Collection"
        subtitle="Collection sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={collection}
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
      {nft && <NftCard nft={nft} isFetching={isFetching} />}
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

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useNfts } = useHooks(mode);
  const state = useListState();
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
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
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
      <IncludeSections {...state} />
      <ResultsList
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

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteNfts } = useHooks(mode);
  const state = useListState();

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
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as NftSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeSections {...state} />
      <ResultsList
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

function SubscriptionTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useNftSubscription } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useNftSubscription({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
    invalidate,
  });
  const nfts = data ?? [];
  const isLoading = data === null && isSubscribed;
  const normalizedError =
    error instanceof Error
      ? error
      : error != null
        ? new Error(typeof error === 'string' ? error : 'Unknown error')
        : null;

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

      <FilterFieldsRow
        configs={FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
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
      <IncludeSections {...state} />
      <ResultsList
        items={nfts}
        isLoading={isLoading}
        isFetching={false}
        error={normalizedError}
        renderItem={(nft) => <NftCard nft={nft} />}
        getKey={(n) => `${n.address}-${n.tokenId}`}
        label="NFTs"
        totalCount={nfts.length}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

export default function NftsPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="NFTs"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useNft</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useNfts</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteNfts</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useNftSubscription</code> hooks
          against live Hasura data. Filter by collection address to exercise the{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useNftsByCollection</code> pattern.
        </>
      }
      tabs={[
        {
          value: 'single',
          label: 'Single NFT',
          icon: <Gem className="size-4" />,
          render: (mode) => <SingleTab mode={mode} />,
        },
        {
          value: 'list',
          label: 'NFT List',
          icon: <Layers className="size-4" />,
          render: (mode) => <ListTab mode={mode} />,
        },
        {
          value: 'infinite',
          label: 'Infinite Scroll',
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
