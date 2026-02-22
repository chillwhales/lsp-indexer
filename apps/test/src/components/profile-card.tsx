import { ExternalLink, Hash, Loader2, User } from 'lucide-react';
import React from 'react';

import { RawJsonToggle } from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSafeUrl, resolveUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Type helpers — access fields that may be absent from narrowed result types
// ---------------------------------------------------------------------------

type ProfileImage = {
  url: string;
  fileType?: string | null;
  width?: number | null;
  height?: number | null;
};
type ProfileLink = { title: string; url: string };

// ---------------------------------------------------------------------------
// Profile Card
// ---------------------------------------------------------------------------

export interface ProfileCardProps {
  /** Accepts full Profile or narrowed ProfileResult<I> — uses field-presence checks */
  profile: Record<string, unknown>;
  isFetching?: boolean;
}

export function ProfileCard({ profile, isFetching }: ProfileCardProps): React.ReactNode {
  // Base field — always present
  const address = profile.address as string;

  // Conditionally included scalar fields
  const name = 'name' in profile ? (profile.name as string | null) : undefined;
  const description = 'description' in profile ? (profile.description as string | null) : undefined;
  const followerCount =
    'followerCount' in profile ? (profile.followerCount as number | null) : undefined;
  const followingCount =
    'followingCount' in profile ? (profile.followingCount as number | null) : undefined;

  // Conditionally included array fields
  const tags =
    'tags' in profile && Array.isArray(profile.tags) ? (profile.tags as string[]) : undefined;
  const links =
    'links' in profile && Array.isArray(profile.links)
      ? (profile.links as ProfileLink[])
      : undefined;
  const avatar =
    'avatar' in profile && Array.isArray(profile.avatar)
      ? (profile.avatar as ProfileImage[])
      : undefined;
  const profileImage =
    'profileImage' in profile && Array.isArray(profile.profileImage)
      ? (profile.profileImage as ProfileImage[])
      : undefined;
  const backgroundImage =
    'backgroundImage' in profile && Array.isArray(profile.backgroundImage)
      ? (profile.backgroundImage as ProfileImage[])
      : undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-muted-foreground" />
              {name !== undefined ? (name ?? 'Unnamed Profile') : 'Profile'}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-1 break-all">
              {address}
            </CardDescription>
          </div>
          <div className="flex gap-3 text-sm">
            {followerCount !== undefined && followerCount !== null && (
              <div className="text-center">
                <div className="font-semibold">{followerCount}</div>
                <div className="text-muted-foreground text-xs">Followers</div>
              </div>
            )}
            {followingCount !== undefined && followingCount !== null && (
              <div className="text-center">
                <div className="font-semibold">{followingCount}</div>
                <div className="text-muted-foreground text-xs">Following</div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Hash className="size-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {links && links.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Links</h4>
            <div className="space-y-1">
              {links.map((link, i) =>
                isSafeUrl(link.url) ? (
                  <a
                    key={`${link.url}-${i}`}
                    href={resolveUrl(link.url)}
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

        {avatar && avatar.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Avatar Assets ({avatar.length})
            </h5>
            <div className="space-y-1.5">
              {avatar.map((asset, i) => (
                <div key={i} className="flex items-center gap-2">
                  {asset.fileType && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {asset.fileType}
                    </Badge>
                  )}
                  {isSafeUrl(asset.url) ? (
                    <a
                      href={resolveUrl(asset.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline truncate"
                    >
                      {asset.url}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {asset.url}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profileImage && profileImage.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Profile Image ({profileImage.length})
            </h5>
            <div className="space-y-1.5">
              {profileImage.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  {isSafeUrl(img.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveUrl(img.url)}
                      alt=""
                      className="size-8 rounded object-cover shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="size-8 rounded bg-muted shrink-0" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {img.url}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {backgroundImage && backgroundImage.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Background Image ({backgroundImage.length})
            </h5>
            <div className="space-y-1.5">
              {backgroundImage.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  {isSafeUrl(img.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveUrl(img.url)}
                      alt=""
                      className="size-8 rounded object-cover shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="size-8 rounded bg-muted shrink-0" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {img.url}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <RawJsonToggle data={profile} label="profile" />
      </CardContent>
    </Card>
  );
}
