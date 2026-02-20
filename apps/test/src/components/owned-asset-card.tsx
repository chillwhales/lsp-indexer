import type { OwnedAsset } from '@lsp-indexer/types';
import { ChevronDown, Coins, Loader2, User, Wallet } from 'lucide-react';
import React from 'react';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { RawJsonToggle } from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTokenAmount } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO timestamp to a relative time string (e.g. "2 days ago") */
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

/**
 * Format balance: use formatTokenAmount when digital asset decimals are available,
 * otherwise show raw bigint string with thousands separators.
 */
function formatBalance(balance: bigint, decimals: number | null | undefined): string {
  if (decimals != null && decimals > 0) {
    return formatTokenAmount(balance.toString(), decimals);
  }
  // No decimals: show raw value with thousands separators for readability
  return balance.toLocaleString();
}

/**
 * Build a descriptive tooltip for the balance field.
 * Always shows the raw bigint; when decimals available, also shows formatted.
 */
function balanceTooltip(balance: bigint, decimals: number | null | undefined): string {
  const raw = balance.toString();
  if (decimals != null && decimals > 0) {
    return `Raw: ${raw} (${decimals} decimals)`;
  }
  return `Raw: ${raw}`;
}

// ---------------------------------------------------------------------------
// Owned Asset Card
// ---------------------------------------------------------------------------

export interface OwnedAssetCardProps {
  ownedAsset: OwnedAsset;
  isFetching?: boolean;
}

export function OwnedAssetCard({ ownedAsset, isFetching }: OwnedAssetCardProps): React.ReactNode {
  const decimals = ownedAsset.digitalAsset?.decimals;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-muted-foreground" />
              {ownedAsset.digitalAsset?.name ?? 'Owned Asset'}
              {ownedAsset.digitalAsset?.symbol && (
                <span className="text-base font-normal text-muted-foreground">
                  ({ownedAsset.digitalAsset.symbol})
                </span>
              )}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">
              ID: {ownedAsset.id}
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {ownedAsset.tokenIdCount !== null && (
              <Badge variant="secondary" className="text-xs">
                {ownedAsset.tokenIdCount} token ID{ownedAsset.tokenIdCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {formatRelativeTime(ownedAsset.timestamp)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core ownership details */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Owner</dt>
            <dd className="font-mono text-xs break-all">{ownedAsset.owner}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Asset Address</dt>
            <dd className="font-mono text-xs break-all">{ownedAsset.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Balance</dt>
            <dd>
              <Tooltip>
                <TooltipTrigger className="font-mono underline decoration-dashed underline-offset-2 cursor-default">
                  {formatBalance(ownedAsset.balance, decimals)}
                  {decimals != null && ownedAsset.digitalAsset?.symbol && (
                    <span className="text-muted-foreground ml-1">
                      {ownedAsset.digitalAsset.symbol}
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">
                    {balanceTooltip(ownedAsset.balance, decimals)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Block</dt>
            <dd className="font-mono text-xs">{ownedAsset.block}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Timestamp</dt>
            <dd className="text-xs">
              {new Date(ownedAsset.timestamp).toLocaleString()}{' '}
              <span className="text-muted-foreground">
                ({formatRelativeTime(ownedAsset.timestamp)})
              </span>
            </dd>
          </div>
        </dl>

        {/* Universal Profile section (collapsible, reuses ProfileCard) */}
        {ownedAsset.universalProfile && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                Universal Profile:{' '}
                {ownedAsset.universalProfile.name ?? ownedAsset.universalProfile.address}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ProfileCard profile={ownedAsset.universalProfile} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Digital Asset section (collapsible) */}
        {ownedAsset.digitalAsset && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Coins className="size-3.5" />
                Digital Asset: {ownedAsset.digitalAsset.name ?? ownedAsset.digitalAsset.address}
                {ownedAsset.digitalAsset.symbol && (
                  <span className="text-muted-foreground font-normal">
                    ({ownedAsset.digitalAsset.symbol})
                  </span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <DigitalAssetCard digitalAsset={ownedAsset.digitalAsset} />
            </CollapsibleContent>
          </Collapsible>
        )}

        <RawJsonToggle data={ownedAsset} label="ownedAsset" />
      </CardContent>
    </Card>
  );
}
