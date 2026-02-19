// Server component — validates server + types entry points work in RSC context
import { CheckCircle2, XCircle } from 'lucide-react';
import React from 'react';

import { IndexerError } from '@lsp-indexer/react';
import { getServerUrl } from '@lsp-indexer/react/server';
import type { IndexerErrorCategory } from '@lsp-indexer/react/types';

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
  // Validate type import works (compile-time check)
  const _typeCheck: IndexerErrorCategory = 'CONFIGURATION';

  // Validate main entry import works
  const errorClassName = IndexerError.name;

  // Touch getServerUrl to prove the import resolved (may throw if env not set — that's OK)
  void getServerUrl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Playground</h1>
        <p className="text-muted-foreground">
          Validate @lsp-indexer/react entry points, hooks, and integrations.
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
            ok
            label="@lsp-indexer/react"
            detail={`imported successfully (${errorClassName})`}
          />
          <StatusRow
            ok
            label="@lsp-indexer/react/server"
            detail="imported successfully (getServerUrl)"
          />
          <StatusRow
            ok
            label="@lsp-indexer/react/types"
            detail="imported successfully (IndexerErrorCategory)"
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

      {/* Unused variable usage to avoid TS errors */}
      <div className="hidden">{_typeCheck}</div>
    </div>
  );
}
