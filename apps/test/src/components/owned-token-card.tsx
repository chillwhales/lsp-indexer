import type { OwnedToken } from '@lsp-indexer/types';
import { ChevronDown, Loader2, Tag } from 'lucide-react';
import React from 'react';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { NftCard } from '@/components/nft-card';
import { OwnedAssetCard } from '@/components/owned-asset-card';
import { RawJsonToggle } from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate an address to 0x1234...abcd format */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Format an ISO timestamp to a relative time string */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs)) return timestamp;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

// ---------------------------------------------------------------------------
// Owned Token Card
// ---------------------------------------------------------------------------

export interface OwnedTokenCardProps {
  ownedToken: OwnedToken;
  isFetching?: boolean;
}

export function OwnedTokenCard({ ownedToken, isFetching }: OwnedTokenCardProps): React.ReactNode {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Tag className="size-5 text-muted-foreground" />
              {ownedToken.digitalAsset?.name ?? 'Owned Token'}
              {ownedToken.digitalAsset?.symbol && (
                <span className="text-base font-normal text-muted-foreground">
                  ({ownedToken.digitalAsset.symbol})
                </span>
              )}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">
              ID: {ownedToken.id}
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {ownedToken.nft?.isMinted && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              >
                Minted
              </Badge>
            )}
            {ownedToken.nft?.isBurned && (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
              >
                Burned
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {formatRelativeTime(ownedToken.timestamp)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core ownership details */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Owner</dt>
            <dd>
              <Tooltip>
                <TooltipTrigger className="font-mono text-xs underline decoration-dashed underline-offset-2 cursor-default">
                  {truncateAddress(ownedToken.owner)}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{ownedToken.owner}</p>
                </TooltipContent>
              </Tooltip>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Asset Address</dt>
            <dd>
              <Tooltip>
                <TooltipTrigger className="font-mono text-xs underline decoration-dashed underline-offset-2 cursor-default">
                  {truncateAddress(ownedToken.address)}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{ownedToken.address}</p>
                </TooltipContent>
              </Tooltip>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Token ID</dt>
            <dd className="font-mono text-xs break-all">{ownedToken.tokenId}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Block</dt>
            <dd className="font-mono text-xs">{ownedToken.block}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Timestamp</dt>
            <dd className="text-xs">
              {new Date(ownedToken.timestamp).toLocaleString()}{' '}
              <span className="text-muted-foreground">
                ({formatRelativeTime(ownedToken.timestamp)})
              </span>
            </dd>
          </div>
        </dl>

        {/* Universal Profile section (collapsible, reuses ProfileCard) */}
        {ownedToken.universalProfile && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-semibold hover:underline cursor-pointer">
              <ChevronDown className="size-3.5" />
              Universal Profile:{' '}
              {ownedToken.universalProfile.name ??
                truncateAddress(ownedToken.universalProfile.address)}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ProfileCard profile={ownedToken.universalProfile} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* NFT section (collapsible) */}
        {ownedToken.nft && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-semibold hover:underline cursor-pointer">
              <ChevronDown className="size-3.5" />
              NFT:{' '}
              {ownedToken.nft.name ??
                `${truncateAddress(ownedToken.nft.address)} #${ownedToken.nft.tokenId}`}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <NftCard nft={ownedToken.nft} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Digital Asset section (collapsible) */}
        {ownedToken.digitalAsset && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-semibold hover:underline cursor-pointer">
              <ChevronDown className="size-3.5" />
              Digital Asset: {ownedToken.digitalAsset.name ?? ownedToken.digitalAsset.address}
              {ownedToken.digitalAsset.symbol && (
                <span className="text-muted-foreground font-normal">
                  ({ownedToken.digitalAsset.symbol})
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <DigitalAssetCard digitalAsset={ownedToken.digitalAsset} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Owned Asset section (collapsible) */}
        {ownedToken.ownedAsset && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-semibold hover:underline cursor-pointer">
              <ChevronDown className="size-3.5" />
              Owned Asset: {truncateAddress(ownedToken.ownedAsset.address)} (balance:{' '}
              {ownedToken.ownedAsset.balance.toString()})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <OwnedAssetCard ownedAsset={ownedToken.ownedAsset} />
            </CollapsibleContent>
          </Collapsible>
        )}

        <RawJsonToggle data={ownedToken} label="ownedToken" />
      </CardContent>
    </Card>
  );
}
