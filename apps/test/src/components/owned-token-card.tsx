import { ChevronDown, Coins, Gem, Loader2, Tag, User, Wallet } from 'lucide-react';
import React from 'react';

import type { OwnedToken } from '@lsp-indexer/types';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { NftCard } from '@/components/nft-card';
import { OwnedAssetCard } from '@/components/owned-asset-card';
import { RawJsonToggle } from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatRelativeTime } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Owned Token Card
// ---------------------------------------------------------------------------

export interface OwnedTokenCardProps {
  /** Accepts any shape of OwnedToken — full, narrowed via include, or partial from nested relations */
  ownedToken: Partial<OwnedToken> &
    Pick<OwnedToken, 'id' | 'digitalAssetAddress' | 'holderAddress' | 'tokenId'>;
  isFetching?: boolean;
}

export function OwnedTokenCard({ ownedToken, isFetching }: OwnedTokenCardProps): React.ReactNode {
  // Destructure — base fields always present, everything else may be undefined
  const {
    id,
    digitalAssetAddress,
    holderAddress,
    tokenId,
    block,
    timestamp,
    holder,
    nft,
    digitalAsset,
    ownedAsset,
  } = ownedToken;

  // Derive name/symbol from nested digital asset for header
  const daName = digitalAsset?.name;
  const daSymbol = digitalAsset?.symbol;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Tag className="size-5 text-muted-foreground" />
              {daName !== undefined ? (daName ?? 'Owned Token') : 'Owned Token'}
              {daSymbol && (
                <span className="text-base font-normal text-muted-foreground">({daSymbol})</span>
              )}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">ID: {id}</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {nft?.isMinted && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              >
                Minted
              </Badge>
            )}
            {nft?.isBurned && (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
              >
                Burned
              </Badge>
            )}
            {timestamp && (
              <Badge variant="outline" className="text-xs">
                {formatRelativeTime(timestamp)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core ownership details */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Holder</dt>
            <dd className="font-mono text-xs break-all">{holderAddress}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Asset Address</dt>
            <dd className="font-mono text-xs break-all">{digitalAssetAddress}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Token ID</dt>
            <dd className="font-mono text-xs break-all">{tokenId}</dd>
          </div>
          {block != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Block</dt>
              <dd className="font-mono text-xs">{block}</dd>
            </div>
          )}
          {timestamp && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">({formatRelativeTime(timestamp)})</span>
              </dd>
            </div>
          )}
        </dl>

        {/* Holder Profile section (collapsible, reuses ProfileCard) */}
        {holder != null && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                Holder Profile: {holder.name ?? holder.address}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ProfileCard profile={holder} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* NFT section (collapsible) */}
        {nft != null && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Gem className="size-3.5" />
                NFT: {nft.name ?? `${nft.address} #${nft.tokenId}`}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <NftCard nft={nft} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Digital Asset section (collapsible) */}
        {digitalAsset != null && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Coins className="size-3.5" />
                Digital Asset: {daName ?? digitalAsset.address}
                {daSymbol && (
                  <span className="text-muted-foreground font-normal">({daSymbol})</span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <DigitalAssetCard digitalAsset={digitalAsset} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Owned Asset section (collapsible) */}
        {ownedAsset != null && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Wallet className="size-3.5" />
                Owned Asset: {ownedAsset.digitalAssetAddress}
                {ownedAsset.balance != null && ` (balance: ${ownedAsset.balance.toString()})`}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <OwnedAssetCard ownedAsset={ownedAsset} />
            </CollapsibleContent>
          </Collapsible>
        )}

        <RawJsonToggle data={ownedToken} label="ownedToken" />
      </CardContent>
    </Card>
  );
}
