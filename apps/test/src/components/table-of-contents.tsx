'use client';

/**
 * Table of contents — sticky sidebar that follows scroll.
 * Scans the page for headings and highlights the currently visible one.
 */
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents(): React.ReactNode {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Collect headings on mount and when route changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const article = document.querySelector('article');
      if (!article) return;

      const elements = article.querySelectorAll('h2[id], h3[id]');
      const items: TocItem[] = Array.from(elements).map((el) => ({
        id: el.id,
        text: el.textContent ?? '',
        level: el.tagName === 'H2' ? 2 : 3,
      }));
      setHeadings(items);
      setActiveId('');
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Observe which heading is in view
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto py-6"
      aria-label="Table of contents"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block py-1 transition-colors hover:text-foreground ${
                h.level === 3 ? 'pl-3' : ''
              } ${activeId === h.id ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
