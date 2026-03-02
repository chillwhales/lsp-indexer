'use client';

import { useProfileSubscription } from '@lsp-indexer/react';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const upcomingDomains = [
  'Digital Assets',
  'NFTs',
  'Owned Assets',
  'Owned Tokens',
  'Followers',
  'Creators',
  'Issued Assets',
  'Encrypted Assets',
  'Data Changed Events',
  'Token ID Data Changed Events',
  'Universal Receiver Events',
];

function ProfilesSubscriptionDemo() {
  const [addressFilter, setAddressFilter] = useState('');
  const [limit, setLimit] = useState(10);
  const [invalidate, setInvalidate] = useState(false);

  const { data, isConnected, isSubscribed, error } = useProfileSubscription({
    filter: addressFilter ? { name: addressFilter } : undefined,
    limit,
    invalidate,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Radio className="size-5" />
            Profiles Subscription
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
              {isConnected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {isSubscribed ? 'Subscribed' : 'Idle'}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Real-time Universal Profile updates via WebSocket subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="profile-name-filter">Name Filter</Label>
            <Input
              id="profile-name-filter"
              placeholder="Search by name..."
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-limit">Limit</Label>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger id="profile-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end space-x-2 pb-0.5">
            <Switch id="profile-invalidate" checked={invalidate} onCheckedChange={setInvalidate} />
            <Label htmlFor="profile-invalidate">Invalidate Cache</Label>
          </div>
        </div>

        {/* Error display */}
        {error != null && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        {/* Results */}
        {data === null ? (
          <p className="text-sm text-muted-foreground">Waiting for subscription data...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No profiles matching filter.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {data.length} profile{data.length !== 1 ? 's' : ''} received
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((profile) => (
                <Card key={profile.address} className="p-3">
                  <p className="text-sm font-medium">{profile.name ?? '(unnamed)'}</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {profile.address}
                  </p>
                  {profile.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {profile.description}
                    </p>
                  )}
                  <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                    <span>{profile.followerCount} followers</span>
                    <span>{profile.followingCount} following</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions Playground</h1>
        <p className="text-muted-foreground">Real-time data via WebSocket subscriptions</p>
      </div>

      {/* Profiles — first domain subscription hook */}
      <ProfilesSubscriptionDemo />

      {/* Upcoming domain subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Domains</CardTitle>
          <CardDescription>
            Domain subscription hooks will be added in sub-phases 10.3–10.13.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingDomains.map((domain) => (
              <Card key={domain} className="border-dashed">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {domain}
                  </CardTitle>
                  <CardDescription className="text-xs">Coming in Phase 10.x</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
