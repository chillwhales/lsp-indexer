'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';

/** Copy-to-clipboard button for code blocks. */
export function CopyButton({ text }: { text: string }): React.ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
