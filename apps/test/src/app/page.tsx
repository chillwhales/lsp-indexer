/**
 * Home page — Quick install guide for @lsp-indexer packages with secure env status indicators.
 *
 * Shows a developer-friendly getting started guide with:
 * 1. Package installation commands
 * 2. Environment variable setup (names + scope only — never actual values)
 * 3. Provider wrapping instructions
 * 4. Hook usage examples
 * 5. Package import validation (server component)
 * 6. Env availability status (boolean indicators only)
 */
import { CheckCircle2, Code, Package, Settings, Terminal, XCircle, Zap } from 'lucide-react';
import React from 'react';

import { getProfile } from '@lsp-indexer/next';
import { IndexerError, getServerUrl, profileKeys } from '@lsp-indexer/node';
import { useProfile } from '@lsp-indexer/react';
import type { Profile } from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ConnectionStatus } from '@/components/connection-status';
import { getEnvAvailability } from '@/lib/env-config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Displays a package import validation row with success/failure icon. */
function StatusRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}): React.ReactNode {
  return (
    <div className="flex items-center gap-2 py-1">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
      )}
      <span className="font-medium text-sm">{label}</span>
      <span className="text-muted-foreground text-sm">— {detail}</span>
    </div>
  );
}

/** Displays an env var availability row with set/not-set badge — never shows the actual value. */
function EnvStatusRow({
  name,
  isSet,
  scope,
}: {
  name: string;
  isSet: boolean;
  scope: 'Client' | 'Server';
}): React.ReactNode {
  return (
    <div className="flex items-center gap-2 py-1">
      {isSet ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{name}</code>
      <Badge variant={isSet ? 'default' : 'outline'} className="text-xs">
        {isSet ? 'configured' : 'not set'}
      </Badge>
      <span className="text-muted-foreground text-xs">({scope})</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage(): React.ReactNode {
  // Prove each import resolved — compile-time type check + runtime reference
  const _types: Profile | null = null;
  const _node = typeof profileKeys === 'object' && typeof getServerUrl === 'function';
  const _react = typeof IndexerError === 'function' && typeof useProfile === 'function';
  const _next = typeof getProfile === 'function';

  // Secure env availability — booleans only, never actual values
  const env = getEnvAvailability();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Getting Started with @lsp-indexer</h1>
        <p className="text-muted-foreground">
          Type-safe React hooks and Next.js server actions for querying LUKSO blockchain data via
          Hasura GraphQL.
        </p>
      </div>

      {/* Step 1 — Install */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Step 1 — Install Packages
          </CardTitle>
          <CardDescription>Add the packages you need to your project</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>
              npm install @lsp-indexer/types @lsp-indexer/node @lsp-indexer/react @lsp-indexer/next
            </code>
          </pre>
        </CardContent>
      </Card>

      {/* Step 2 — Configure Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Step 2 — Configure Environment
          </CardTitle>
          <CardDescription>
            Set env vars pointing to your Hasura GraphQL endpoint. You need at least one HTTP
            variable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">Variable</th>
                  <th className="pb-2 pr-4 font-medium">Scope</th>
                  <th className="pb-2 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      NEXT_PUBLIC_INDEXER_URL
                    </code>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline" className="text-xs">
                      Client
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    HTTP endpoint for <code className="text-xs">@lsp-indexer/react</code> hooks
                    (browser → Hasura)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">INDEXER_URL</code>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant="secondary" className="text-xs">
                      Server
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    HTTP endpoint for <code className="text-xs">@lsp-indexer/next</code> server
                    actions
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      NEXT_PUBLIC_INDEXER_WS_URL
                    </code>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline" className="text-xs">
                      Client
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    WebSocket for client subscriptions (optional — falls back to HTTP URL)
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">INDEXER_WS_URL</code>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant="secondary" className="text-xs">
                      Server
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    WebSocket for server-side subscriptions (optional — falls back to HTTP URL)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 — Wrap Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Step 3 — Wrap Providers
          </CardTitle>
          <CardDescription>
            Add the subscription provider to your app for real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>{`import { IndexerSubscriptionProvider } from '@lsp-indexer/react';

// Wrap your app:
<IndexerSubscriptionProvider>
  <App />
</IndexerSubscriptionProvider>`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Step 4 — Use Hooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Step 4 — Use Hooks
          </CardTitle>
          <CardDescription>
            Query LUKSO blockchain data with type-safe hooks. Explore the sidebar playground pages
            to try all available hooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>{`import { useProfile } from '@lsp-indexer/react';

const { data, isLoading } = useProfile({ address: '0x...' });`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Environment Status — boolean indicators only, never actual values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Status
          </CardTitle>
          <CardDescription>
            Shows which env vars are configured — values are never exposed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <EnvStatusRow name="NEXT_PUBLIC_INDEXER_URL" isSet={env.hasClientUrl} scope="Client" />
          <EnvStatusRow name="INDEXER_URL" isSet={env.hasServerUrl} scope="Server" />
          <EnvStatusRow name="NEXT_PUBLIC_INDEXER_WS_URL" isSet={env.hasClientWs} scope="Client" />
          <EnvStatusRow name="INDEXER_WS_URL" isSet={env.hasServerWs} scope="Server" />
          <p className="mt-3 text-muted-foreground text-xs">
            {env.hasClientUrl && env.hasServerUrl
              ? '✓ Both client and server modes available'
              : env.hasClientUrl
                ? '✓ Client mode available (set INDEXER_URL for server mode)'
                : env.hasServerUrl
                  ? '✓ Server mode available (set NEXT_PUBLIC_INDEXER_URL for client mode)'
                  : '⚠ No endpoints configured — set at least one HTTP env var'}
          </p>
        </CardContent>
      </Card>

      {/* Package Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Status
          </CardTitle>
          <CardDescription>Entry point import validation (server component)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <StatusRow
            ok={_types === null}
            label="@lsp-indexer/types"
            detail="Profile, ProfileFilter, ProfileSort, ..."
          />
          <StatusRow
            ok={_node}
            label="@lsp-indexer/node"
            detail="profileKeys, getServerUrl, fetchProfile, ..."
          />
          <StatusRow
            ok={_react}
            label="@lsp-indexer/react"
            detail="useProfile, useProfiles, useInfiniteProfiles"
          />
          <StatusRow
            ok={_next}
            label="@lsp-indexer/next"
            detail="getProfile, getProfiles (server actions)"
          />
        </CardContent>
      </Card>

      <ConnectionStatus />
    </div>
  );
}
