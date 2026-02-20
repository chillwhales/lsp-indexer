'use client';

import { Infinity, Layers, Monitor, Search, Server, Tag } from 'lucide-react';
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
  OwnedToken,
  OwnedTokenFilter,
  OwnedTokenInclude,
  OwnedTokenSort,
  OwnedTokenSortField,
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

import { OwnedTokenCard } from '@/components/owned-token-card';
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

// ---------------------------------------------------------------------------
// Owned Tokens domain config
// ---------------------------------------------------------------------------

const OWNED_TOKEN_FILTERS: FilterFieldConfig[] = [
  { key: 'owner', label: 'Owner Address', placeholder: '0x... (owner)', mono: true },
  { key: 'address', label: 'Asset Address', placeholder: '0x... (asset contract)', mono: true },
  { key: 'tokenId', label: 'Token ID', placeholder: 'Token ID', mono: true },
  {
    key: 'digitalAssetId',
    label: 'Digital Asset ID',
    placeholder: 'Digital asset FK',
    mono: true,
  },
  { key: 'nftId', label: 'NFT ID', placeholder: 'NFT FK', mono: true },
  { key: 'ownedAssetId', label: 'Owned Asset ID', placeholder: 'Owned asset FK', mono: true },
  {
    key: 'universalProfileId',
    label: 'Universal Profile ID',
    placeholder: 'Universal profile FK',
    mono: true,
  },
];

const OWNED_TOKEN_SORT_OPTIONS: SortOption[] = [
  { value: 'address', label: 'Address' },
  { value: 'block', label: 'Block' },
  { value: 'owner', label: 'Owner' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'tokenId', label: 'Token ID' },
];

const OWNED_TOKEN_INCLUDES: IncludeToggleConfig[] = [
  { key: 'nft', label: 'NFT' },
  { key: 'ownedAsset', label: 'Owned Asset' },
  { key: 'universalProfile', label: 'Universal Profile' },
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

/** Build an OwnedTokenFilter from debounced filter field values */
function buildOwnedTokenFilter(
  debouncedValues: Record<string, string>,
): OwnedTokenFilter | undefined {
  const f: OwnedTokenFilter = {};
  if (debouncedValues.owner) f.owner = debouncedValues.owner;
  if (debouncedValues.address) f.address = debouncedValues.address;
  if (debouncedValues.tokenId) f.tokenId = debouncedValues.tokenId;
  if (debouncedValues.digitalAssetId) f.digitalAssetId = debouncedValues.digitalAssetId;
  if (debouncedValues.nftId) f.nftId = debouncedValues.nftId;
  if (debouncedValues.ownedAssetId) f.ownedAssetId = debouncedValues.ownedAssetId;
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
    /** Returns the digitalAsset include value for the OwnedTokenInclude object */
    value: enabled ? (subInclude ?? {}) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Build OwnedTokenInclude from toggle state + DA sub-includes
// ---------------------------------------------------------------------------

function buildOwnedTokenInclude(
  includeValues: Record<string, boolean>,
  daValue: Record<string, boolean> | undefined,
): OwnedTokenInclude | undefined {
  // Check if all base toggles are ON and DA is enabled with all sub-includes ON
  const allBaseOn = Object.values(includeValues).every(Boolean);
  const daAllOn = daValue !== undefined && Object.keys(daValue).length === 0;

  if (allBaseOn && daAllOn) return undefined; // Everything ON = use defaults

  const include: OwnedTokenInclude = {};
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

function useOwnedTokenListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(OWNED_TOKEN_FILTERS);
  const [sortField, setSortField] = useState<OwnedTokenSortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sortNulls, setSortNulls] = useState<SortNulls | undefined>(undefined);
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(OWNED_TOKEN_INCLUDES);
  const da = useDigitalAssetInclude();

  const filter = buildOwnedTokenFilter(debouncedValues);
  const sort: OwnedTokenSort = { field: sortField, direction: sortDirection, nulls: sortNulls };
  const hasActiveFilter = Object.values(debouncedValues).some(Boolean);
  const include = buildOwnedTokenInclude(includeValues, da.value);

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
// Tab 1: Single Owned Token
// ---------------------------------------------------------------------------

function SingleOwnedTokenTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedTokens } = useHooks(mode);
  const [ownerInput, setOwnerInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [queryOwner, setQueryOwner] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const [queryTokenId, setQueryTokenId] = useState('');
  const { values: includeValues, toggle: toggleInclude } = useIncludeToggles(OWNED_TOKEN_INCLUDES);
  const da = useDigitalAssetInclude();
  const include = buildOwnedTokenInclude(includeValues, da.value);

  const hasQuery = Boolean(queryOwner) && Boolean(queryAddress);
  const filter: OwnedTokenFilter | undefined = hasQuery
    ? {
        owner: queryOwner,
        address: queryAddress,
        ...(queryTokenId ? { tokenId: queryTokenId } : {}),
      }
    : undefined;

  const { ownedTokens, isLoading, error, isFetching } = useOwnedTokens({
    filter,
    limit: 1,
    include,
  });
  const ownedToken = ownedTokens[0] ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryOwner(ownerInput);
    setQueryAddress(addressInput);
    setQueryTokenId(tokenIdInput);
  };

  return (
    <div className="space-y-4">
      {/* Lookup inputs: owner + asset address + optional tokenId (natural keys) */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="owned-token-owner">Holder Address</Label>
          <Input
            id="owned-token-owner"
            placeholder="0x... (holder / owner address)"
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

      {/* Include toggles */}
      <IncludeToggles
        configs={OWNED_TOKEN_INCLUDES}
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
      {ownedToken && <OwnedTokenCard ownedToken={ownedToken} isFetching={isFetching} />}

      {/* Empty state */}
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

function OwnedTokenListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useOwnedTokens } = useHooks(mode);
  const state = useOwnedTokenListState();
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
        configs={OWNED_TOKEN_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={OWNED_TOKEN_SORT_OPTIONS}
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
      <IncludeToggles
        configs={OWNED_TOKEN_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <DigitalAssetIncludeSection
        enabled={state.da.enabled}
        setEnabled={state.da.setEnabled}
        subValues={state.da.subValues}
        toggleSub={state.da.toggleSub}
      />
      <ResultsList<OwnedToken>
        items={ownedTokens}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ownedToken) => <OwnedTokenCard ownedToken={ownedToken} />}
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

function InfiniteScrollTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useInfiniteOwnedTokens } = useHooks(mode);
  const state = useOwnedTokenListState();

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
        configs={OWNED_TOKEN_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={OWNED_TOKEN_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as OwnedTokenSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        sortNulls={state.sortNulls ?? ''}
        onSortNullsChange={(v) =>
          state.setSortNulls(v === 'default' ? undefined : (v as SortNulls))
        }
      />
      <IncludeToggles
        configs={OWNED_TOKEN_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <DigitalAssetIncludeSection
        enabled={state.da.enabled}
        setEnabled={state.da.setEnabled}
        subValues={state.da.subValues}
        toggleSub={state.da.toggleSub}
      />
      <ResultsList<OwnedToken>
        items={ownedTokens}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(ownedToken) => <OwnedTokenCard ownedToken={ownedToken} />}
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
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Owned Tokens</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedToken</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useOwnedTokens</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteOwnedTokens</code>{' '}
            hooks against live Hasura data. Filter by owner to find individual NFT ownership records
            (QUERY-04).
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
          <TabsTrigger value="single">
            <Tag className="size-4" />
            Single Lookup
          </TabsTrigger>
          <TabsTrigger value="list">
            <Layers className="size-4" />
            Owned Token List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Infinity className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleOwnedTokenTab mode={mode} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <OwnedTokenListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
