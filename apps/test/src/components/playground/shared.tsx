'use client';

import { AlertCircle, ChevronDown, Code2 } from 'lucide-react';
import React from 'react';

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

/** JSON replacer that converts BigInt values to strings so JSON.stringify doesn't throw. */
function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Row of preset buttons for quick single-lookup testing.
 * Generic over the preset shape — each page can define its own preset type.
 */
export function PresetButtons<T extends { label: string }>({
  presets,
  onSelect,
}: {
  presets: readonly T[];
  onSelect: (preset: T) => void;
}): React.ReactNode {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-muted-foreground self-center">Presets:</span>
      {presets.map((preset) => (
        <Button key={preset.label} variant="outline" size="sm" onClick={() => onSelect(preset)}>
          {preset.label}
        </Button>
      ))}
    </div>
  );
}

export function RawJsonToggle({ data, label }: { data: unknown; label: string }): React.ReactNode {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Code2 className="size-3.5" />
          Toggle Raw JSON ({label})
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap break-all">
          {JSON.stringify(data, bigintReplacer, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
