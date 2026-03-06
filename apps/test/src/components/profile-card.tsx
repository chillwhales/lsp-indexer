/**
 * Renders a single Universal Profile (LSP3) entity card.
 *
 * Props use `PartialExcept<Profile, 'address'>` — only `address` is required;
 * all other fields are optional so the card gracefully handles include-narrowed
 * results where some fields are absent.
 *
 * **Sections:**
 * - Header: address (always), name, follower/following counts
 * - Description: profile bio text
 * - Tags: LSP3 profile tags as badges
 * - Links: external links with safe-URL validation
 * - Avatar: avatar image assets with file type badges
 * - Profile Image: via `<ImageList>` component
 * - Background Image: via `<ImageList>` component
 * - Raw JSON toggle
 */
import { ExternalLink, Hash, Loader2, User } from 'lucide-react';
import React from 'react';

import type { PartialExcept, Profile } from '@lsp-indexer/types';

import { ImageList } from '@/components/image-list';
import { RawJsonToggle } from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSafeUrl, resolveUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Profile Card
// ---------------------------------------------------------------------------

export interface ProfileCardProps {
  /** Accepts any shape of Profile — full, narrowed via include, or partial from nested relations */
  profile: PartialExcept<Profile, 'address'>;
  isFetching?: boolean;
}

export function ProfileCard({ profile, isFetching }: ProfileCardProps): React.ReactNode {
  // Destructure — address is always present, everything else may be undefined
  const {
    address,
    name,
    description,
    followerCount,
    followingCount,
    tags,
    links,
    avatar,
    profileImage,
    backgroundImage,
  } = profile;

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
            {followerCount != null && (
              <div className="text-center">
                <div className="font-semibold">{followerCount}</div>
                <div className="text-muted-foreground text-xs">Followers</div>
              </div>
            )}
            {followingCount != null && (
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

        {tags != null && tags.length > 0 && (
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

        {links != null && links.length > 0 && (
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

        {avatar != null && avatar.length > 0 && (
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

        {profileImage != null && profileImage.length > 0 && (
          <ImageList label={`Profile Image (${profileImage.length})`} images={profileImage} />
        )}

        {backgroundImage != null && backgroundImage.length > 0 && (
          <ImageList
            label={`Background Image (${backgroundImage.length})`}
            images={backgroundImage}
          />
        )}

        <RawJsonToggle data={profile} label="profile" />
      </CardContent>
    </Card>
  );
}
