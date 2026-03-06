/**
 * Home Page — package entry point validation and environment status dashboard.
 *
 * This is the only **server component** page in the test app. It validates that
 * all 4 `@lsp-indexer` packages resolve correctly in an RSC (React Server Component)
 * context by importing a representative export from each:
 *
 * - `@lsp-indexer/types` — `Profile` type (compile-time import check)
 * - `@lsp-indexer/node` — `profileKeys`, `getServerUrl` (runtime reference check)
 * - `@lsp-indexer/react` — `useProfile`, `IndexerError` (runtime reference check)
 * - `@lsp-indexer/next` — `getProfile` (runtime reference check)
 *
 * **Patterns shown:**
 * - RSC-compatible imports (no 'use client' — proves packages work server-side)
 * - Environment variable inspection (`NEXT_PUBLIC_INDEXER_URL`, `INDEXER_URL`, WS variants)
 * - Client-side import validation via `<ConnectionStatus>` child component
 *
 * @see {@link ConnectionStatus} for client-side import validation
 */
import { CheckCircle2, XCircle } from 'lucide-react';
import React from 'react';

import { getProfile } from '@lsp-indexer/next';
import { IndexerError, getServerUrl, profileKeys } from '@lsp-indexer/node';
import { useProfile } from '@lsp-indexer/react';
import type { Profile } from '@lsp-indexer/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ConnectionStatus } from '@/components/connection-status';

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

function EnvRow({ name, value }: { name: string; value: string | undefined }): React.ReactNode {
  const isSet = Boolean(value);
  return (
    <div className="flex items-center gap-2 py-1">
      {isSet ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
      )}
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{name}</code>
      {isSet ? (
        <code className="truncate text-muted-foreground text-xs">{value}</code>
      ) : (
        <Badge variant="outline" className="text-xs">
          not set
        </Badge>
      )}
    </div>
  );
}

export default function HomePage(): React.ReactNode {
  // Prove each import resolved — compile-time type check + runtime reference
  const _types: Profile | null = null;
  const _node = typeof profileKeys === 'object' && typeof getServerUrl === 'function';
  const _react = typeof IndexerError === 'function' && typeof useProfile === 'function';
  const _next = typeof getProfile === 'function';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Playground</h1>
        <p className="text-muted-foreground">
          Validate @lsp-indexer packages, hooks, and integrations.
        </p>
      </div>

      {/* Package Entry Point Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Package Status</CardTitle>
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

      {/* Environment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>Server-side env var configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <EnvRow name="NEXT_PUBLIC_INDEXER_URL" value={process.env.NEXT_PUBLIC_INDEXER_URL} />
          <EnvRow name="INDEXER_URL" value={process.env.INDEXER_URL} />
          <EnvRow
            name="NEXT_PUBLIC_INDEXER_WS_URL"
            value={process.env.NEXT_PUBLIC_INDEXER_WS_URL}
          />
          <EnvRow name="INDEXER_WS_URL" value={process.env.INDEXER_WS_URL} />
        </CardContent>
      </Card>

      {/* Client-side import validation */}
      <ConnectionStatus />
    </div>
  );
}
