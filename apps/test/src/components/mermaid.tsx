'use client';

/**
 * Mermaid diagram renderer — client component that renders mermaid syntax to SVG.
 * Automatically re-renders when the theme changes (dark/light).
 */
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import { useEffect, useId, useRef, useState } from 'react';

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps): React.ReactNode {
  const id = useId().replace(/:/g, '-');
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    const render = async (): Promise<void> => {
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
        fontFamily: 'inherit',
      });

      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, chart.trim());
        setSvg(rendered);
      } catch {
        // Mermaid throws on invalid syntax — show raw text as fallback
        setSvg('');
      }
    };

    render();
  }, [chart, id, resolvedTheme]);

  if (!svg) {
    return (
      <pre className="text-sm text-muted-foreground">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="not-prose my-4 flex justify-center [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
