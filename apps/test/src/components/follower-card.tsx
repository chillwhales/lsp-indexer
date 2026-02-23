import { ArrowRight, User } from 'lucide-react';
import React from 'react';

import type { PartialExcept } from '@lsp-indexer/types';

import { CollapsibleProfileSection } from '@/components/collapsible-sections';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, getProfileLabel } from '@/lib/utils';

// ---------------------------------------------------------------------------
// FollowerCard
// ---------------------------------------------------------------------------

export interface FollowerCardProps {
  /** Accepts any shape of Follower — full, narrowed via include, or partial */
  follower: Record<string, unknown>;
  index: number;
}

export function FollowerCard({ follower, index }: FollowerCardProps): React.ReactNode {
  const obj = follower;

  const followerLabel = getProfileLabel(
    obj.followerProfile as Record<string, unknown> | undefined,
    obj.followerAddress as string,
  );
  const followedLabel = getProfileLabel(
    obj.followedProfile as Record<string, unknown> | undefined,
    obj.followedAddress as string,
  );

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
            <dd className="font-mono text-xs break-all">{obj.followerAddress as string}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-36 shrink-0">Followed Address</dt>
            <dd className="font-mono text-xs break-all">{obj.followedAddress as string}</dd>
          </div>

          {/* Conditional scalar fields via field-presence checks */}
          {'timestamp' in obj && obj.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-36 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(obj.timestamp as string).toLocaleString()}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(obj.timestamp as string)})
                </span>
              </dd>
            </div>
          )}
          {'address' in obj && obj.address != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-36 shrink-0">Contract Address</dt>
              <dd className="font-mono text-xs break-all">{obj.address as string}</dd>
            </div>
          )}
        </dl>

        {/* Collapsible section 1: Follower Profile */}
        {'followerProfile' in obj && obj.followerProfile != null && (
          <CollapsibleProfileSection
            label="Follower Profile"
            profile={obj.followerProfile as PartialExcept<{ address: string }, 'address'>}
          />
        )}

        {/* Collapsible section 2: Followed Profile */}
        {'followedProfile' in obj && obj.followedProfile != null && (
          <CollapsibleProfileSection
            label="Followed Profile"
            profile={obj.followedProfile as PartialExcept<{ address: string }, 'address'>}
          />
        )}

        <RawJsonToggle data={follower} label="follower" />
      </CardContent>
    </Card>
  );
}
