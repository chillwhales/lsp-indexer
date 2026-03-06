/** Collapsible section wrappers for nested profile, digital asset, and NFT relations. */
import { ChevronDown, Coins, Gem, User } from 'lucide-react';
import React from 'react';

import type { DigitalAsset, Nft, PartialExcept, Profile } from '@lsp-indexer/types';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { NftCard } from '@/components/nft-card';
import { ProfileCard } from '@/components/profile-card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getDigitalAssetLabel, getProfileLabel } from '@/lib/utils';

export interface CollapsibleProfileSectionProps {
  /** Trigger label prefix, e.g. "Holder Profile", "Creator Profile" */
  label: string;
  /** The profile object — must have at least `address` */
  profile: PartialExcept<Profile, 'address'>;
  /** Optional extra content rendered before the ProfileCard (e.g. timestamp) */
  before?: React.ReactNode;
}

export function CollapsibleProfileSection({
  label,
  profile,
  before,
}: CollapsibleProfileSectionProps): React.ReactNode {
  const displayLabel = getProfileLabel(profile, profile.address);

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <User className="size-3.5" />
          {label}: {displayLabel}
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        {before}
        <ProfileCard profile={profile} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface CollapsibleDigitalAssetSectionProps {
  /** Trigger label prefix, e.g. "Digital Asset", "Collection" */
  label: string;
  /** The digital asset object — must have at least `address` */
  digitalAsset: PartialExcept<DigitalAsset, 'address'>;
}

export function CollapsibleDigitalAssetSection({
  label,
  digitalAsset,
}: CollapsibleDigitalAssetSectionProps): React.ReactNode {
  const { label: daLabel, symbol } = getDigitalAssetLabel(digitalAsset, digitalAsset.address);

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Coins className="size-3.5" />
          {label}: {daLabel}
          {symbol && <span className="text-muted-foreground font-normal">({symbol})</span>}
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <DigitalAssetCard digitalAsset={digitalAsset} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface CollapsibleNftSectionProps {
  /** Trigger label prefix, e.g. "NFT", "NFT Info" */
  label: string;
  /** The NFT object — must have at least base fields */
  nft: PartialExcept<Nft, 'address' | 'tokenId' | 'isBurned' | 'isMinted'>;
}

export function CollapsibleNftSection({ label, nft }: CollapsibleNftSectionProps): React.ReactNode {
  const name = nft.name ?? null;
  const displayLabel = name ?? `${nft.address.slice(0, 8)}…`;

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Gem className="size-3.5" />
          {label}: {displayLabel}
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <NftCard nft={nft} />
      </CollapsibleContent>
    </Collapsible>
  );
}
