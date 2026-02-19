'use client';

import { AlertCircle, ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function ErrorAlert({ error }: { error: Error }): React.ReactNode {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

export function RawJsonToggle({ data, label }: { data: unknown; label: string }): React.ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Code2 className="size-3.5" />
          Raw JSON ({label})
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
