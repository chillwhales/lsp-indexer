// Server component — validates server + types entry points work in RSC context
import { CheckCircle2, XCircle } from 'lucide-react';
import React from 'react';

import { IndexerError } from '@lsp-indexer/react';
import { getServerUrl } from '@lsp-indexer/react/server';
import type { IndexerErrorCategory } from '@lsp-indexer/react/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
      <Badge variant={isSet ? 'secondary' : 'outline'} className="text-xs">
        {isSet ? 'configured' : 'not set'}
      </Badge>
    </div>
  );
}

export default function HomePage(): React.ReactNode {
  // Validate type import works (compile-time check)
  const _typeCheck: IndexerErrorCategory = 'CONFIGURATION';

  // Validate main entry import works
  const errorClassName = IndexerError.name;

  // Validate server entry — try to get URL, catch if env vars not set
  let serverUrlStatus: string;
  let serverUrlOk = false;
  try {
    const url = getServerUrl();
    serverUrlStatus = `Resolved: ${url}`;
    serverUrlOk = true;
  } catch (error) {
    if (error instanceof IndexerError) {
      serverUrlStatus = `Not configured (${error.code})`;
    } else {
      serverUrlStatus = 'Unknown error checking server URL';
    }
  }

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
        <CardContent>
          <div className="space-y-1">
            <EnvRow name="NEXT_PUBLIC_INDEXER_URL" value={process.env.NEXT_PUBLIC_INDEXER_URL} />
            <EnvRow name="INDEXER_URL" value={process.env.INDEXER_URL} />
          </div>
          <Separator className="my-3" />
          <StatusRow ok={serverUrlOk} label="Server URL" detail={serverUrlStatus} />
        </CardContent>
      </Card>

      {/* Client-side import validation */}
      <ConnectionStatus />

      {/* Unused variable usage to avoid TS errors */}
      <div className="hidden">{_typeCheck}</div>
    </div>
  );
}
