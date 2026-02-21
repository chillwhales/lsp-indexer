'use client';

import { Monitor, Server } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** Which package's hooks to use — shared across all playground pages. */
export type HookMode = 'client' | 'server';

export interface TabConfig {
  value: string;
  label: string;
  icon: React.ReactNode;
  render: (mode: HookMode) => React.ReactNode;
}

interface PlaygroundPageLayoutProps {
  title: string;
  description: React.ReactNode;
  tabs: TabConfig[];
}

/**
 * Shared page shell for all playground domain pages.
 *
 * Provides: title, description, client/server mode toggle, package badge,
 * and tabbed layout. Each tab's `render` function receives the current
 * `HookMode` so child components pick the right hook set.
 *
 * `key={mode}` on Tabs forces a full remount when switching modes,
 * which avoids hook-rule violations from conditional hook calls.
 */
export function PlaygroundPageLayout({
  title,
  description,
  tabs,
}: PlaygroundPageLayoutProps): React.ReactNode {
  const [mode, setMode] = useState<HookMode>('client');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Client / Server mode toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={mode === 'client' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('client')}
            className="gap-1.5"
          >
            <Monitor className="size-3.5" />
            Client
          </Button>
          <Button
            variant={mode === 'server' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('server')}
            className="gap-1.5"
          >
            <Server className="size-3.5" />
            Server
          </Button>
        </div>
      </div>

      {/* Mode indicator */}
      <div className="flex items-center gap-2">
        <Badge variant={mode === 'client' ? 'default' : 'secondary'}>
          {mode === 'client' ? '@lsp-indexer/react' : '@lsp-indexer/next'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {mode === 'client' ? 'Browser → Hasura directly' : 'Browser → Server Action → Hasura'}
        </span>
      </div>

      {/* key={mode} forces full remount when switching — avoids hook-rule violations */}
      <Tabs defaultValue={tabs[0]?.value} key={mode}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {tab.render(mode)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
