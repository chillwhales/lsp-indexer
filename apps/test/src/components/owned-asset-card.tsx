import { ChevronDown, Coins, Loader2, User, Wallet } from 'lucide-react';
import React from 'react';

import type { OwnedAsset } from '@lsp-indexer/types';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { RawJsonToggle } from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatRelativeTime, formatTokenAmount } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  /** Accepts any shape of OwnedAsset — full, narrowed via include, or partial from nested relations */
  ownedAsset: Partial<OwnedAsset> &
    Pick<OwnedAsset, 'id' | 'digitalAssetAddress' | 'holderAddress'>;
  isFetching?: boolean;
}

export function OwnedAssetCard({ ownedAsset, isFetching }: OwnedAssetCardProps): React.ReactNode {
  // Destructure — base fields always present, everything else may be undefined
  const {
    id,
    digitalAssetAddress,
    holderAddress,
    balance,
    block,
    timestamp,
    tokenIdCount,
    digitalAsset,
    holder,
  } = ownedAsset;

  // Derive decimals and name/symbol from nested digital asset for display
  const decimals = digitalAsset?.decimals;
  const daName = digitalAsset?.name;
  const daSymbol = digitalAsset?.symbol;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-muted-foreground" />
              {daName !== undefined ? (daName ?? 'Owned Asset') : 'Owned Asset'}
              {daSymbol && (
                <span className="text-base font-normal text-muted-foreground">({daSymbol})</span>
              )}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">ID: {id}</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {tokenIdCount != null && (
              <Badge variant="secondary" className="text-xs">
                {tokenIdCount} token ID{tokenIdCount !== 1 ? 's' : ''}
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
          {balance != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Balance</dt>
              <dd>
                <Tooltip>
                  <TooltipTrigger className="font-mono underline decoration-dashed underline-offset-2 cursor-default">
                    {formatBalance(balance, decimals)}
                    {decimals != null && daSymbol && (
                      <span className="text-muted-foreground ml-1">{daSymbol}</span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">{balanceTooltip(balance, decimals)}</p>
                  </TooltipContent>
                </Tooltip>
              </dd>
            </div>
          )}
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

        <RawJsonToggle data={ownedAsset} label="ownedAsset" />
      </CardContent>
    </Card>
  );
}
