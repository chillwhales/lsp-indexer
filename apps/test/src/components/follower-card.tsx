import { ArrowRight, User } from 'lucide-react';
import React from 'react';

import type { Follower, PartialExcept } from '@lsp-indexer/types';

import { CollapsibleProfileSection } from '@/components/collapsible-sections';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, getProfileLabel } from '@/lib/utils';

// ---------------------------------------------------------------------------
// FollowerCard
// ---------------------------------------------------------------------------

export interface FollowerCardProps {
  follower: PartialExcept<Follower, 'followerAddress' | 'followedAddress'>;
  index: number;
}

export function FollowerCard({ follower, index }: FollowerCardProps): React.ReactNode {
  const obj = follower;

  const followerProfile = 'followerProfile' in obj ? obj.followerProfile : null;
  const followedProfile = 'followedProfile' in obj ? obj.followedProfile : null;

  const followerLabel = getProfileLabel(followerProfile, obj.followerAddress);
  const followedLabel = getProfileLabel(followedProfile, obj.followedAddress);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <User className="size-4 text-muted-foreground" />
          <span className="truncate">{followerLabel}</span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{followedLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base fields — always present */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-36 shrink-0">Follower Address</dt>
            <dd className="font-mono text-xs break-all">{obj.followerAddress}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-36 shrink-0">Followed Address</dt>
            <dd className="font-mono text-xs break-all">{obj.followedAddress}</dd>
          </div>

          {/* Conditional scalar fields via field-presence checks */}
          {'address' in obj && obj.address != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-36 shrink-0">Contract Address</dt>
              <dd className="font-mono text-xs break-all">{obj.address}</dd>
            </div>
          )}
          {'timestamp' in obj && obj.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-36 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(obj.timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">({formatRelativeTime(obj.timestamp)})</span>
              </dd>
            </div>
          )}
          {'blockNumber' in obj && obj.blockNumber != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-36 shrink-0">Block Number</dt>
              <dd className="font-mono text-xs">{String(obj.blockNumber)}</dd>
            </div>
          )}
          {'transactionIndex' in obj && obj.transactionIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-36 shrink-0">Tx Index</dt>
              <dd className="font-mono text-xs">{String(obj.transactionIndex)}</dd>
            </div>
          )}
          {'logIndex' in obj && obj.logIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-36 shrink-0">Log Index</dt>
              <dd className="font-mono text-xs">{String(obj.logIndex)}</dd>
            </div>
          )}
        </dl>

        {/* Collapsible section 1: Follower Profile */}
        {followerProfile != null && (
          <CollapsibleProfileSection label="Follower Profile" profile={followerProfile} />
        )}

        {/* Collapsible section 2: Followed Profile */}
        {followedProfile != null && (
          <CollapsibleProfileSection label="Followed Profile" profile={followedProfile} />
        )}

        <RawJsonToggle data={follower} label="follower" />
      </CardContent>
    </Card>
  );
}
