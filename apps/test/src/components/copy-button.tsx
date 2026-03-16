'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

/** Copy-to-clipboard button for code blocks. */
export function CopyButton({ text }: { text: string }): React.ReactNode {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Clear timeout on unmount to avoid setting state after unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (non-secure context, permission denied) — ignore silently
    }
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 cursor-pointer"
      onClick={handleCopy}
      aria-label="Copy code"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
