import { ChevronDown, Coins, User } from 'lucide-react';
import React from 'react';

import type { DigitalAsset, PartialExcept, Profile } from '@lsp-indexer/types';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { ProfileCard } from '@/components/profile-card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getDigitalAssetLabel, getProfileLabel } from '@/lib/utils';

// ---------------------------------------------------------------------------
// CollapsibleProfileSection
// ---------------------------------------------------------------------------

export interface CollapsibleProfileSectionProps {
  /** Trigger label prefix, e.g. "Holder Profile", "Creator Profile" */
  label: string;
  /** The profile object — must have at least `address` */
  profile: PartialExcept<Profile, 'address'>;
  /** Optional extra content rendered before the ProfileCard (e.g. timestamp) */
  before?: React.ReactNode;
}

/**
 * Reusable collapsible section for displaying a profile relation.
 *
 * Trigger shows: `{label}: {name ?? truncatedAddress}`
 * Content renders the full `<ProfileCard>`.
 *
 * Used by: follower-card, creator-card, owned-asset-card, owned-token-card, nft-card.
 */
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

// ---------------------------------------------------------------------------
// CollapsibleDigitalAssetSection
// ---------------------------------------------------------------------------

export interface CollapsibleDigitalAssetSectionProps {
  /** Trigger label prefix, e.g. "Digital Asset", "Collection" */
  label: string;
  /** The digital asset object — must have at least `address` */
  digitalAsset: PartialExcept<DigitalAsset, 'address'>;
}

/**
 * Reusable collapsible section for displaying a digital asset relation.
 *
 * Trigger shows: `{label}: {name ?? truncatedAddress} ({symbol})`
 * Content renders the full `<DigitalAssetCard>`.
 *
 * Used by: creator-card, owned-asset-card, owned-token-card, nft-card.
 */
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
