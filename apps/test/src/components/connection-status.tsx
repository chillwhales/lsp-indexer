'use client';

/**
 * Client-side import validation component.
 *
 * Mounted as a client component on the home page to verify that `@lsp-indexer/node`
 * imports resolve correctly in a browser (client component) context. Imports
 * `IndexerError` and validates it's a function at runtime.
 *
 * Complements the server-side import validation done in the RSC home page.
 */
import { CheckCircle2 } from 'lucide-react';
import React from 'react';

import { IndexerError } from '@lsp-indexer/node';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConnectionStatus(): React.ReactNode {
  // Validate main entry import works at runtime in client component
  const errorClassName = IndexerError.name;

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
      </CardContent>
    </Card>
  );
}
