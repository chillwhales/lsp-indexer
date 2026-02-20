'use client';

import {
  Coins,
  ExternalLink,
  Infinity,
  Layers,
  Loader2,
  Monitor,
  Search,
  Server,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  useDigitalAsset as useDigitalAssetNext,
  useDigitalAssets as useDigitalAssetsNext,
  useInfiniteDigitalAssets as useInfiniteDigitalAssetsNext,
} from '@lsp-indexer/next';
import {
  useDigitalAsset as useDigitalAssetReact,
  useDigitalAssets as useDigitalAssetsReact,
  useInfiniteDigitalAssets as useInfiniteDigitalAssetsReact,
} from '@lsp-indexer/react';
import type {
  DigitalAsset,
  DigitalAssetFilter,
  DigitalAssetSort,
  DigitalAssetSortField,
  SortDirection,
  TokenType,
} from '@lsp-indexer/types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { FilterFieldConfig, IncludeToggleConfig, SortOption } from '@/components/playground';
import {
  ErrorAlert,
  FilterFieldsRow,
  IncludeToggles,
  RawJsonToggle,
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
      useDigitalAsset: useDigitalAssetNext,
      useDigitalAssets: useDigitalAssetsNext,
      useInfiniteDigitalAssets: useInfiniteDigitalAssetsNext,
    };
  }
  return {
    useDigitalAsset: useDigitalAssetReact,
    useDigitalAssets: useDigitalAssetsReact,
    useInfiniteDigitalAssets: useInfiniteDigitalAssetsReact,
  };
}

// ---------------------------------------------------------------------------
// Digital Assets domain config
// ---------------------------------------------------------------------------

const DIGITAL_ASSET_FILTERS: FilterFieldConfig[] = [
  { key: 'name', label: 'Name', placeholder: 'Search by name...' },
  { key: 'symbol', label: 'Symbol', placeholder: 'e.g. CHILL' },
  { key: 'tokenType', label: 'Token Type', placeholder: 'TOKEN, NFT, or COLLECTION' },
  { key: 'category', label: 'Category', placeholder: 'Search by category...' },
  {
    key: 'holderAddress',
    label: 'Holder Address',
    placeholder: '0x... (token holder)',
    mono: true,
  },
  { key: 'ownerAddress', label: 'Owner Address', placeholder: '0x... (controller)', mono: true },
] as const;

const DIGITAL_ASSET_SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'symbol', label: 'Symbol' },
  { value: 'holderCount', label: 'Holders' },
  { value: 'creatorCount', label: 'Creators' },
  { value: 'totalSupply', label: 'Total Supply' },
  { value: 'createdAt', label: 'Created At' },
];

const DIGITAL_ASSET_INCLUDES: IncludeToggleConfig[] = [
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

const PRESET_ADDRESSES = [
  { label: 'CHILL (LSP7)', address: '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14' },
  { label: 'Chillwhales (LSP8)', address: '0x86E817172b5c07f7036Bf8aA46e2db9063743A83' },
] as const;

/** Build a DigitalAssetFilter from debounced filter field values */
function buildDigitalAssetFilter(
  debouncedValues: Record<string, string>,
): DigitalAssetFilter | undefined {
  const f: DigitalAssetFilter = {};
  if (debouncedValues.name) f.name = debouncedValues.name;
  if (debouncedValues.symbol) f.symbol = debouncedValues.symbol;
  if (debouncedValues.tokenType) {
    const upper = debouncedValues.tokenType.toUpperCase();
    if (upper === 'TOKEN' || upper === 'NFT' || upper === 'COLLECTION') {
      f.tokenType = upper as TokenType;
    }
  }
  if (debouncedValues.category) f.category = debouncedValues.category;
  if (debouncedValues.holderAddress) f.holderAddress = debouncedValues.holderAddress;
  if (debouncedValues.ownerAddress) f.ownerAddress = debouncedValues.ownerAddress;
  return Object.keys(f).length > 0 ? f : undefined;
}

// ---------------------------------------------------------------------------
// Color-coded badge for the 4 token type combinations
// ---------------------------------------------------------------------------

interface StandardBadgeProps {
  standard: DigitalAsset['standard'];
  tokenType: DigitalAsset['tokenType'];
}

function StandardBadge({ standard, tokenType }: StandardBadgeProps): React.ReactNode {
  if (!standard && !tokenType) return null;

  let label = '';
  let className = '';

  if (standard === 'LSP7' && tokenType === 'TOKEN') {
    label = 'LSP7 TOKEN';
    className =
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  } else if (standard === 'LSP7' && tokenType === 'NFT') {
    label = 'LSP7 NFT';
    className =
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
  } else if (standard === 'LSP8' && tokenType === 'NFT') {
    label = 'LSP8 NFT';
    className =
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  } else if (standard === 'LSP8' && tokenType === 'COLLECTION') {
    label = 'LSP8 COLLECTION';
    className =
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
  } else {
    // Fallback for partial data
    label = [standard, tokenType].filter(Boolean).join(' ');
    className = 'bg-muted text-muted-foreground';
  }

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validate that a URL uses a safe protocol (prevents javascript: / data: XSS) */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ipfs:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** Truncate an address to 0x1234...abcd format */
function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Compact card for lists
// ---------------------------------------------------------------------------

function DigitalAssetCardCompact({ asset }: { asset: DigitalAsset }): React.ReactNode {
  const firstIcon = asset.icons[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {firstIcon && isSafeUrl(firstIcon.url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstIcon.url}
              alt={asset.name ?? 'icon'}
              className="size-6 rounded object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Coins className="size-4 text-muted-foreground" />
          )}
          {asset.name ?? 'Unnamed Asset'}
          {asset.symbol && (
            <span className="text-sm font-normal text-muted-foreground">({asset.symbol})</span>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs truncate">{asset.address}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <StandardBadge standard={asset.standard} tokenType={asset.tokenType} />
        </div>
        {asset.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{asset.description}</p>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          {asset.holderCount !== null && <span>{asset.holderCount} holders</span>}
          {asset.creatorCount !== null && <span>{asset.creatorCount} creators</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared filter + sort hook for list and infinite tabs
// ---------------------------------------------------------------------------

function useDigitalAssetListState() {
  const { values, debouncedValues, setFieldValue } = useFilterFields(DIGITAL_ASSET_FILTERS);
  const [sortField, setSortField] = useState<DigitalAssetSortField>('holderCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(DIGITAL_ASSET_INCLUDES);

  const filter = buildDigitalAssetFilter(debouncedValues);
  const sort: DigitalAssetSort = { field: sortField, direction: sortDirection };
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
    includeValues,
    toggleInclude,
    include,
  };
}

// ---------------------------------------------------------------------------
// Tab 1: Single Digital Asset
// ---------------------------------------------------------------------------

function SingleAssetTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAsset } = useHooks(mode);
  const [address, setAddress] = useState('');
  const [queryAddress, setQueryAddress] = useState('');
  const {
    values: includeValues,
    toggle: toggleInclude,
    include,
  } = useIncludeToggles(DIGITAL_ASSET_INCLUDES);

  const { digitalAsset, isLoading, error, isFetching } = useDigitalAsset({
    address: queryAddress,
    include,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryAddress(address);
  };

  const handlePreset = (presetAddress: string) => {
    setAddress(presetAddress);
    setQueryAddress(presetAddress);
  };

  return (
    <div className="space-y-4">
      {/* Address input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Enter digital asset address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono text-sm"
        />
        <Button type="submit" disabled={!address}>
          <Search className="size-4" />
          Fetch
        </Button>
      </form>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Presets:</span>
        {PRESET_ADDRESSES.map((preset) => (
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
      <IncludeToggles
        configs={DIGITAL_ASSET_INCLUDES}
        values={includeValues}
        onToggle={toggleInclude}
      />

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
      {digitalAsset && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="size-5 text-muted-foreground" />
                  {digitalAsset.name ?? 'Unnamed Asset'}
                  {digitalAsset.symbol && (
                    <span className="text-base font-normal text-muted-foreground">
                      ({digitalAsset.symbol})
                    </span>
                  )}
                  {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  {digitalAsset.address}
                </CardDescription>
                <StandardBadge
                  standard={digitalAsset.standard}
                  tokenType={digitalAsset.tokenType}
                />
              </div>
              <div className="flex gap-3 text-sm">
                {digitalAsset.holderCount !== null && (
                  <div className="text-center">
                    <div className="font-semibold">{digitalAsset.holderCount}</div>
                    <div className="text-muted-foreground text-xs">Holders</div>
                  </div>
                )}
                {digitalAsset.creatorCount !== null && (
                  <div className="text-center">
                    <div className="font-semibold">{digitalAsset.creatorCount}</div>
                    <div className="text-muted-foreground text-xs">Creators</div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Core token details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {digitalAsset.decimals !== null && (
                <div>
                  <span className="text-muted-foreground">Decimals:</span>{' '}
                  <span className="font-mono">{digitalAsset.decimals}</span>
                </div>
              )}
              {digitalAsset.totalSupply !== null && (
                <div>
                  <span className="text-muted-foreground">Total Supply:</span>{' '}
                  <span className="font-mono">{digitalAsset.totalSupply}</span>
                </div>
              )}
              {digitalAsset.category && (
                <div>
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <span>{digitalAsset.category}</span>
                </div>
              )}
              {digitalAsset.owner && (
                <div>
                  <span className="text-muted-foreground">Owner:</span>{' '}
                  <span className="font-mono text-xs" title={digitalAsset.owner.address}>
                    {truncateAddress(digitalAsset.owner.address)}
                  </span>
                </div>
              )}
            </div>

            {/* LSP4 Metadata */}
            <div>
              <h4 className="text-sm font-semibold mb-2">LSP4 Metadata</h4>
              <div className="space-y-3">
                {digitalAsset.description && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Description</h5>
                    <p className="text-sm">{digitalAsset.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Icons:</span>{' '}
                    <Badge variant="outline" className="text-xs">
                      {digitalAsset.icons.length}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Images:</span>{' '}
                    <Badge variant="outline" className="text-xs">
                      {digitalAsset.images.length}
                    </Badge>
                  </div>
                </div>

                {digitalAsset.links.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Links</h5>
                    <div className="space-y-1">
                      {digitalAsset.links.map((link, i) =>
                        isSafeUrl(link.url) ? (
                          <a
                            key={`${link.url}-${i}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="size-3.5" />
                            {link.title || link.url}
                          </a>
                        ) : (
                          <span
                            key={`${link.url}-${i}`}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground"
                          >
                            <ExternalLink className="size-3.5" />
                            {link.title || link.url}
                            <Badge variant="outline" className="text-xs">
                              unsafe URL
                            </Badge>
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {digitalAsset.attributes.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Attributes ({digitalAsset.attributes.length})
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {digitalAsset.attributes.map((attr, i) => (
                        <Badge key={`${attr.key}-${i}`} variant="secondary" className="text-xs">
                          {attr.key}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LSP8 Section — only shown when standard is LSP8 */}
            {digitalAsset.standard === 'LSP8' && (
              <div className="border rounded-lg p-3 space-y-2 bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                  LSP8 Token Details
                </h4>
                {digitalAsset.referenceContract !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Reference Contract:</span>{' '}
                    <span
                      className="font-mono text-xs"
                      title={digitalAsset.referenceContract ?? ''}
                    >
                      {digitalAsset.referenceContract
                        ? truncateAddress(digitalAsset.referenceContract)
                        : 'not set'}
                    </span>
                  </div>
                )}
                {digitalAsset.tokenIdFormat !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Token ID Format:</span>{' '}
                    <span className="font-mono">{digitalAsset.tokenIdFormat ?? 'not set'}</span>
                  </div>
                )}
                {digitalAsset.baseUri !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Base URI:</span>{' '}
                    {digitalAsset.baseUri ? (
                      isSafeUrl(digitalAsset.baseUri) ? (
                        <a
                          href={digitalAsset.baseUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono text-xs"
                        >
                          {digitalAsset.baseUri}
                        </a>
                      ) : (
                        <span className="font-mono text-xs">{digitalAsset.baseUri}</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">not set</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <RawJsonToggle data={digitalAsset} label="digitalAsset" />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {queryAddress && !isLoading && !error && !digitalAsset && (
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertTitle>No Asset Found</AlertTitle>
          <AlertDescription>
            No digital asset found at address{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{queryAddress}</code>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Asset List
// ---------------------------------------------------------------------------

function AssetListTab({ mode }: { mode: HookMode }): React.ReactNode {
  const { useDigitalAssets } = useHooks(mode);
  const state = useDigitalAssetListState();
  const [limit, setLimit] = useState(10);

  const { digitalAssets, totalCount, isLoading, error, isFetching } = useDigitalAssets({
    filter: state.filter,
    sort: state.sort,
    limit,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={DIGITAL_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={DIGITAL_ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DigitalAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
        limit={limit}
        onLimitChange={setLimit}
      />
      <IncludeToggles
        configs={DIGITAL_ASSET_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList<DigitalAsset>
        items={digitalAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <DigitalAssetCardCompact asset={asset} />}
        getKey={(a) => a.address}
        label="digital assets"
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
  const { useInfiniteDigitalAssets } = useHooks(mode);
  const state = useDigitalAssetListState();

  const {
    digitalAssets,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    isFetching,
  } = useInfiniteDigitalAssets({
    filter: state.filter,
    sort: state.sort,
    pageSize: 10,
    include: state.include,
  });

  return (
    <div className="space-y-4">
      <FilterFieldsRow
        configs={DIGITAL_ASSET_FILTERS}
        values={state.values}
        onFieldChange={state.setFieldValue}
      />
      <SortControls
        options={DIGITAL_ASSET_SORT_OPTIONS}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSortFieldChange={(v) => state.setSortField(v as DigitalAssetSortField)}
        onSortDirectionChange={(v) => state.setSortDirection(v as SortDirection)}
      />
      <IncludeToggles
        configs={DIGITAL_ASSET_INCLUDES}
        values={state.includeValues}
        onToggle={state.toggleInclude}
      />
      <ResultsList<DigitalAsset>
        items={digitalAssets}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderItem={(asset) => <DigitalAssetCardCompact asset={asset} />}
        getKey={(a) => a.address}
        label="digital assets"
        hasActiveFilter={state.hasActiveFilter}
        infinite={{ hasNextPage, fetchNextPage, isFetchingNextPage }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DigitalAssetsPage(): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Digital Assets</h1>
          <p className="text-muted-foreground">
            Exercise <code className="text-xs bg-muted px-1 py-0.5 rounded">useDigitalAsset</code>,{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useDigitalAssets</code>, and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">useInfiniteDigitalAssets</code>{' '}
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
            <Coins className="size-4" />
            Single Asset
          </TabsTrigger>
          <TabsTrigger value="list">
            <Layers className="size-4" />
            Asset List
          </TabsTrigger>
          <TabsTrigger value="infinite">
            <Infinity className="size-4" />
            Infinite Scroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleAssetTab mode={mode} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <AssetListTab mode={mode} />
        </TabsContent>

        <TabsContent value="infinite" className="mt-4">
          <InfiniteScrollTab mode={mode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
