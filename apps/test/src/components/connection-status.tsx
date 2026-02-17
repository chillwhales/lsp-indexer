'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { IndexerError } from '@lsp-indexer/react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConnectionStatus(): React.ReactNode {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  // Validate main entry import works at runtime in client component
  const errorClassName = IndexerError.name;

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_INDEXER_URL;
    setPublicUrl(url ?? null);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client-Side Status</CardTitle>
        <CardDescription>Runtime import validation (client component)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center gap-2 py-1">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span className="font-medium text-sm">@lsp-indexer/react (client)</span>
          <span className="text-muted-foreground text-sm">
            — runtime import working ({errorClassName})
          </span>
        </div>
        <div className="flex items-center gap-2 py-1">
          {publicUrl ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-destructive" />
          )}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">NEXT_PUBLIC_INDEXER_URL</code>
          <Badge variant={publicUrl ? 'secondary' : 'outline'} className="text-xs">
            {publicUrl ? `configured` : 'not set'}
          </Badge>
          {publicUrl && (
            <span className="text-muted-foreground text-xs truncate max-w-48">{publicUrl}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
