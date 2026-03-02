'use client';

import { Radio } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const domainSubscriptions = [
  'Profiles',
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

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions Playground</h1>
        <p className="text-muted-foreground">Real-time data via WebSocket subscriptions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="size-5" />
            WebSocket Subscriptions
          </CardTitle>
          <CardDescription>
            Domain subscription hooks will be added in sub-phases 10.2–10.13. Each domain will get
            its own subscription document, hook, and playground section below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {domainSubscriptions.map((domain) => (
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
