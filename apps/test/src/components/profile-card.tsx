import type { Profile } from '@lsp-indexer/types';
import { ExternalLink, Hash, Loader2, User } from 'lucide-react';
import React from 'react';

import { RawJsonToggle } from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSafeUrl, resolveUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Profile Card
// ---------------------------------------------------------------------------

export interface ProfileCardProps {
  profile: Profile;
  isFetching?: boolean;
}

export function ProfileCard({ profile, isFetching }: ProfileCardProps): React.ReactNode {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-muted-foreground" />
              {profile.name ?? 'Unnamed Profile'}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-1 break-all">
              {profile.address}
            </CardDescription>
          </div>
          <div className="flex gap-3 text-sm">
            {profile.followerCount !== null && (
              <div className="text-center">
                <div className="font-semibold">{profile.followerCount}</div>
                <div className="text-muted-foreground text-xs">Followers</div>
              </div>
            )}
            {profile.followingCount !== null && (
              <div className="text-center">
                <div className="font-semibold">{profile.followingCount}</div>
                <div className="text-muted-foreground text-xs">Following</div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{profile.description}</p>
          </div>
        )}

        {profile.tags != null && profile.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {profile.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Hash className="size-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.links != null && profile.links.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Links</h4>
            <div className="space-y-1">
              {profile.links.map((link, i) =>
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

        {profile.avatar != null && profile.avatar.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Avatar Assets ({profile.avatar.length})
            </h5>
            <div className="space-y-1.5">
              {profile.avatar.map((asset, i) => (
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

        {profile.profileImage != null && profile.profileImage.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Profile Image ({profile.profileImage.length})
            </h5>
            <div className="space-y-1.5">
              {profile.profileImage.map((img, i) => (
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

        {profile.backgroundImage != null && profile.backgroundImage.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">
              Background Image ({profile.backgroundImage.length})
            </h5>
            <div className="space-y-1.5">
              {profile.backgroundImage.map((img, i) => (
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
