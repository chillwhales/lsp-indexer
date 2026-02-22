'use client';

import { Infinity, Layers, Search, Tag } from 'lucide-react';
import React, { useState } from 'react';

import {
  useInfiniteOwnedTokens as useInfiniteOwnedTokensNext,
  useOwnedToken as useOwnedTokenNext,
  useOwnedTokens as useOwnedTokensNext,
} from '@lsp-indexer/next';
import {
  useInfiniteOwnedTokens as useInfiniteOwnedTokensReact,
  useOwnedToken as useOwnedTokenReact,
  useOwnedTokens as useOwnedTokensReact,
} from '@lsp-indexer/react';
import type {
  OwnedTokenFilter,
  OwnedTokenInclude,
  OwnedTokenSort,
  OwnedTokenSortField,
  SortDirection,
  SortNulls,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import { OwnedTokenCard } from '@/components/owned-token-card';
import type {
  FilterFieldConfig,
  HookMode,
  IncludeToggleConfig,
  SortOption,
} from '@/components/playground';
import {
  buildNestedInclude,
  DIGITAL_ASSET_INCLUDE_FIELDS,
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  NFT_INCLUDE_FIELDS,
  OWNED_ASSET_INCLUDE_FIELDS,
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

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

const ADDRESS_FILTERS: FilterFieldConfig[] = [
  { key: 'holderAddress', label: 'Holder Address', placeholder: '0x... (holder)', mono: true },
  {
    key: 'digitalAssetAddress',
    label: 'Asset Address',
    placeholder: '0x... (asset contract)',
    mono: true,
  },
  { key: 'tokenId', label: 'Token ID', placeholder: 'Token ID', mono: true },
];

const NAME_FILTERS: FilterFieldConfig[] = [
  { key: 'holderName', label: 'Holder Name', placeholder: 'Search by holder name...' },
  { key: 'assetName', label: 'Asset Name', placeholder: 'Search by collection name...' },
  { key: 'tokenName', label: 'Token Name', placeholder: 'Search by NFT name...' },
];

const ALL_FILTERS = [...ADDRESS_FILTERS, ...NAME_FILTERS];

const SORT_OPTIONS: SortOption[] = [
  { value: 'digitalAssetAddress', label: 'Asset Address' },
  { value: 'block', label: 'Block' },
  { value: 'holderAddress', label: 'Holder Address' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'tokenId', label: 'Token ID' },
];

const BASE_INCLUDES: IncludeToggleConfig[] = [
  { key: 'block', label: 'Block' },
  { key: 'timestamp', label: 'Timestamp' },
];

const PRESETS = [
  {
    label: 'chill-labs × Chillwhale #19',
    owner: '0xB6c10458274431189D4D0dA66ce00dc62A215908',
    address: '0x86E817172b5c07f7036Bf8aA46e2db9063743A83',
    tokenId: '0x0000000000000000000000000000000000000000000000000000000000000013',
  },
  {
    label: 'b00ste × Chillwhale #1',
    owner: '0x00Aa9761286f21437c90AD2f895ef0dcA3484306',
    address: '0x86E817172b5c07f7036Bf8aA46e2db9063743A83',
    tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  },
] as const;

function useHooks(mode: HookMode) {
  if (mode === 'server') {
    return {
      useOwnedToken: useOwnedTokenNext,
      useOwnedTokens: useOwnedTokensNext,
      useInfiniteOwnedTokens: useInfiniteOwnedTokensNext,
    };
  }
  return {
    useOwnedToken: useOwnedTokenReact,
    useOwnedTokens: useOwnedTokensReact,
    useInfiniteOwnedTokens: useInfiniteOwnedTokensReact,
  };
}

function buildFilter(debouncedValues: Record<string, string>): OwnedTokenFilter | undefined {
  const f: OwnedTokenFilter = {};
  if (debouncedValues.holderAddress) f.holderAddress = debouncedValues.holderAddress;
  if (debouncedValues.digitalAssetAddress)
    f.digitalAssetAddress = debouncedValues.digitalAssetAddress;
  if (debouncedValues.tokenId) f.tokenId = debouncedValues.tokenId;
  if (debouncedValues.holderName) f.holderName = debouncedValues.holderName;
  if (debouncedValues.assetName) f.assetName = debouncedValues.assetName;
  if (debouncedValues.tokenName) f.tokenName = debouncedValues.tokenName;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Shared list state
// ---------------------------------------------------------------------------

function useListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(ALL_FILTERS);
  const [sortField, setSortField] = useState<OwnedTokenSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(BASE_INCLUDES);
  const da = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const nft = useSubInclude(NFT_INCLUDE_FIELDS);
  const oa = useSubInclude(OWNED_ASSET_INCLUDE_FIELDS);
  const up = useSubInclude(PROFILE_INCLUDE_FIELDS);

  const filter = buildFilter(debouncedValues);
  const sort: OwnedTokenSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildNestedInclude(includeValues, {
    digitalAsset: da.value,
    nft: nft.value,
    ownedAsset: oa.value,
    holder: up.value,
  }) as OwnedTokenInclude | undefined;

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
    nft,
    oa,
    up,
  };
}

// ---------------------------------------------------------------------------
// Sub-include sections (shared between all 3 tabs)
// ---------------------------------------------------------------------------

function IncludeSections({
  includeValues,
  toggleInclude,
  da,
  nft,
  oa,
  up,
}: ReturnType<typeof useListState>): React.ReactNode {
  return (
    <>
      <IncludeToggles configs={BASE_INCLUDES} values={includeValues} onToggle={toggleInclude} />
      <SubIncludeSection
        label="Digital Asset"
        subtitle="Digital asset sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={da}
      />
      <SubIncludeSection
        label="NFT"
        subtitle="NFT sub-fields"
        configs={NFT_INCLUDE_FIELDS}
        state={nft}
      />
      <SubIncludeSection
        label="Owned Asset"
        subtitle="Owned asset sub-fields"
        configs={OWNED_ASSET_INCLUDE_FIELDS}
        state={oa}
      />
      <SubIncludeSection
        label="Holder Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={up}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Single Owned Token
// ---------------------------------------------------------------------------

function SingleTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedTokens } = useHooks(mode);
  const [ownerInput, setOwnerInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [queryOwner, setQueryOwner] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [queryTokenId, setQueryTokenId] = useState('');
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(BASE_INCLUDES);
  const da = useSubInclude(DIGITAL_ASSET_INCLUDE_FIELDS);
  const nft = useSubInclude(NFT_INCLUDE_FIELDS);
  const oa = useSubInclude(OWNED_ASSET_INCLUDE_FIELDS);
  const up = useSubInclude(PROFILE_INCLUDE_FIELDS);
  const include = buildNestedInclude(includeValues, {
    digitalAsset: da.value,
    nft: nft.value,
    ownedAsset: oa.value,
    holder: up.value,
  }) as OwnedTokenInclude | undefined;

  const hasQuery = Boolean(queryOwner) && Boolean(queryAddress);
  const filter: OwnedTokenFilter | undefined = hasQuery
    ? {
        holderAddress: queryOwner,
        digitalAssetAddress: queryAddress,
        ...(queryTokenId ? { tokenId: queryTokenId } : {}),
      }
    : undefined;

  const { ownedTokens, isLoading, error, isFetching } = useOwnedTokens({
    filter,
    limit: hasQuery ? 1 : 0,
    include,
  });
  const ownedToken = hasQuery ? (ownedTokens[0] ?? null) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryOwner(ownerInput);
    setQueryAddress(addressInput);
    setQueryTokenId(tokenIdInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="owned-token-owner">Holder Address</Label>
          <Input
            id="owned-token-owner"
            placeholder="0x... (holder address)"
            value={ownerInput}
            onChange={(e) => setOwnerInput(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="owned-token-address">Asset Address</Label>
          <Input
            id="owned-token-address"
            placeholder="0x... (asset contract address)"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="owned-token-tokenid">Token ID (optional)</Label>
          <Input
            id="owned-token-tokenid"
            placeholder="Specific token ID (optional)"
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button type="submit" disabled={!ownerInput || !addressInput}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      <PresetButtons
        presets={PRESETS}
        onSelect={(p) => {
          setOwnerInput(p.owner);
          setAddressInput(p.address);
          setTokenIdInput(p.tokenId);
          setQueryOwner(p.owner);
          setQueryAddress(p.address);
          setQueryTokenId(p.tokenId);
        }}
      />

      <IncludeToggles configs={BASE_INCLUDES} values={includeValues} onToggle={toggleInclude} />
      <SubIncludeSection
        label="Digital Asset"
        subtitle="Digital asset sub-fields"
        configs={DIGITAL_ASSET_INCLUDE_FIELDS}
        state={da}
      />
      <SubIncludeSection
        label="NFT"
        subtitle="NFT sub-fields"
        configs={NFT_INCLUDE_FIELDS}
        state={nft}
      />
      <SubIncludeSection
        label="Owned Asset"
        subtitle="Owned asset sub-fields"
        configs={OWNED_ASSET_INCLUDE_FIELDS}
        state={oa}
      />
      <SubIncludeSection
        label="Holder Profile"
        subtitle="Profile sub-fields"
        configs={PROFILE_INCLUDE_FIELDS}
        state={up}
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
      {ownedToken && (
        <OwnedTokenCard
          ownedToken={ownedToken as Record<string, unknown>}
          isFetching={isFetching}
        />
      )}
      {hasQuery && !isLoading && !error && !ownedToken && (
        <Alert>
          <Tag className="h-4 w-4" />
          <AlertTitle>No Owned Token Found</AlertTitle>
          <AlertDescription>
            No owned token found for holder{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryOwner}</code>
            {' on asset '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
            {queryTokenId && (
              <>
                {' with token ID '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryTokenId}</code>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Owned Token List
// ---------------------------------------------------------------------------

function ListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedTokens } = useHooks(mode);
  const state = useListState();
  const [limit, setLimit] = useState(10);

  const { ownedTokens, totalCount, isLoading, error, isFetching } = useOwnedTokens({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ADDRESS_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <FilterFieldsRow
        configs={NAME_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedTokenSortField)}
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
        items={ownedTokens}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ownedToken) => (
          <OwnedTokenCard ownedToken={ownedToken as Record<string, unknown>} />
        )}
        getKey={(t) => t.id}
        label="owned tokens"
        totalCount={totalCount}
        hasActiveFilter={state.hasActiveFilter}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Infinite Scroll
// ---------------------------------------------------------------------------

function InfiniteTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteOwnedTokens } = useHooks(mode);
  const state = useListState();

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
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={ADDRESS_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <FilterFieldsRow
        configs={NAME_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedTokenSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeSections {...state} />
      <ResultsList
        items={ownedTokens}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ownedToken) => (
          <OwnedTokenCard ownedToken={ownedToken as Record<string, unknown>} />
        )}
        getKey={(t) => t.id}
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

export default function OwnedTokensPage(): React.ReactNode {
  return (
    <PlaygroundPageLayout
      title="Owned Tokens"
      description={
        <>
          Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedToken</code>,{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedTokens</code>, and{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteOwnedTokens</code> hooks
          against live Hasura data. Filter by holder to find individual NFT ownership records
          (QUERY-04).
        </>
      }
      tabs={[
        {
          value: 'single',
          label: 'Single Lookup',
          icon: <Tag className="size-4" />,
          render: (mode) => <SingleTab mode={mode} />,
        },
        {
          value: 'list',
          label: 'Owned Token List',
          icon: <Layers className="size-4" />,
          render: (mode) => <ListTab mode={mode} />,
        },
        {
          value: 'infinite',
          label: 'Infinite Scroll',
          icon: <Infinity className="size-4" />,
          render: (mode) => <InfiniteTab mode={mode} />,
        },
      ]}
    />
  );
}
