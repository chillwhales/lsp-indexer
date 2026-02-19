import {
  Bell,
  Calendar,
  Heart,
  Image,
  Layers,
  Lock,
  Paintbrush,
  Rss,
  User,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const domainGroups = [
  {
    category: 'Profiles',
    domains: [
      {
        name: 'Universal Profiles',
        href: '/profiles',
        icon: User,
        description:
          'Query and search LUKSO Universal Profiles with filtering, sorting, and pagination.',
        hooks: ['useProfile', 'useProfiles', 'useInfiniteProfiles'],
      },
    ],
  },
  {
    category: 'Assets & Tokens',
    domains: [
      {
        name: 'Digital Assets',
        href: '/digital-assets',
        icon: Image,
        description:
          'Browse LSP7/LSP8 digital assets with metadata, token info, and owner details.',
        hooks: ['useDigitalAsset', 'useDigitalAssets', 'useInfiniteDigitalAssets'],
      },
      {
        name: 'NFTs',
        href: '/nfts',
        icon: Layers,
        description: 'Query individual NFTs (LSP8 tokens) with collection filtering and metadata.',
        hooks: ['useNft', 'useNfts', 'useNftsByCollection', 'useInfiniteNfts'],
      },
      {
        name: 'Owned Assets',
        href: '/owned-assets',
        icon: Wallet,
        description: 'View assets and tokens owned by a Universal Profile address.',
        hooks: [
          'useOwnedAssets',
          'useOwnedTokens',
          'useInfiniteOwnedAssets',
          'useInfiniteOwnedTokens',
        ],
      },
    ],
  },
  {
    category: 'Social',
    domains: [
      {
        name: 'Follows',
        href: '/follows',
        icon: Heart,
        description: 'Query follower/following relationships and follow counts between profiles.',
        hooks: [
          'useFollowers',
          'useFollowing',
          'useFollowCount',
          'useInfiniteFollowers',
          'useInfiniteFollowing',
        ],
      },
      {
        name: 'Creators',
        href: '/creators',
        icon: Paintbrush,
        description: 'Look up creator addresses (LSP4 Creators) linked to digital assets.',
        hooks: ['useCreatorAddresses', 'useInfiniteCreatorAddresses'],
      },
    ],
  },
  {
    category: 'LSP29 Encrypted',
    domains: [
      {
        name: 'Encrypted Assets',
        href: '/encrypted-assets',
        icon: Lock,
        description: 'Query LSP29 encrypted asset containers with metadata and encryption details.',
        hooks: ['useEncryptedAsset', 'useEncryptedAssets', 'useInfiniteEncryptedAssets'],
      },
      {
        name: 'Encrypted Feed',
        href: '/feed',
        icon: Rss,
        description: 'Browse the encrypted asset feed with chronological entries and filtering.',
        hooks: ['useEncryptedAssetFeed', 'useInfiniteEncryptedAssetFeed'],
      },
    ],
  },
  {
    category: 'Events',
    domains: [
      {
        name: 'Data Changed Events',
        href: '/data-changed',
        icon: Calendar,
        description: 'Track ERC725Y data change events on profiles and digital assets.',
        hooks: ['useDataChangedEvents', 'useInfiniteDataChangedEvents'],
      },
      {
        name: 'Universal Receiver Events',
        href: '/universal-receiver',
        icon: Bell,
        description:
          'Monitor LSP1 Universal Receiver events for asset transfers and notifications.',
        hooks: ['useUniversalReceiverEvents', 'useInfiniteUniversalReceiverEvents'],
      },
    ],
  },
];

export default function HomePage(): React.ReactNode {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Playground</h1>
        <p className="text-muted-foreground">
          Explore all @lsp-indexer query domains. Each playground lets you test hooks in Client or
          Server mode.
        </p>
      </div>

      {domainGroups.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
            {group.category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.domains.map((domain) => (
              <Card key={domain.href} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <domain.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{domain.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{domain.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {domain.hooks.map((hook) => (
                      <Badge key={hook} variant="secondary" className="text-[11px] font-mono">
                        {hook}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={domain.href}>Open Playground →</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
