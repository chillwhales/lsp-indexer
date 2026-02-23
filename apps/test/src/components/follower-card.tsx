import { ChevronDown, User } from 'lucide-react';
import React from 'react';

import type { PartialExcept } from '@lsp-indexer/types';

import { RawJsonToggle } from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ---------------------------------------------------------------------------
// FollowerCard
// ---------------------------------------------------------------------------

export interface FollowerCardProps {
  /** Accepts any shape of Follower — full, narrowed via include, or partial */
  follower: Record<string, unknown>;
  index: number;
}

/**
 * Render profile fields that may be present on a nested profile object.
 * Uses 'key' in obj guards for field-presence checks (DX-04 pattern).
 */
function renderProfileFields(profile: Record<string, unknown>): React.ReactNode {
  return <ProfileCard profile={profile as PartialExcept<{ address: string }, 'address'>} />;
}

export function FollowerCard({ follower, index }: FollowerCardProps): React.ReactNode {
  const obj = follower;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <User className="size-4 text-muted-foreground" />
          Follow Relationship #{index + 1}
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
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                Follower Profile
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {renderProfileFields(obj.followerProfile as Record<string, unknown>)}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Collapsible section 2: Followed Profile */}
        {'followedProfile' in obj && obj.followedProfile != null && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                Followed Profile
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {renderProfileFields(obj.followedProfile as Record<string, unknown>)}
            </CollapsibleContent>
          </Collapsible>
        )}

        <RawJsonToggle data={follower} label="follower" />
      </CardContent>
    </Card>
  );
}
