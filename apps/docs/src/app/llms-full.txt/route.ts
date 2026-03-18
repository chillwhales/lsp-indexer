import { readFileSync } from 'fs';
import { resolve } from 'path';

import { NextResponse } from 'next/server';

const SLUGS = [
  { slug: 'index', title: '@lsp-indexer' },
  { slug: 'quickstart', title: 'Quickstart' },
  { slug: 'indexer', title: 'Indexer' },
  { slug: 'node', title: '@lsp-indexer/node' },
  { slug: 'react', title: '@lsp-indexer/react' },
  { slug: 'next', title: '@lsp-indexer/next' },
] as const;

export function GET(): NextResponse {
  const parts: string[] = [];

  for (const { slug } of SLUGS) {
    const mdPath = resolve(process.cwd(), 'public/llm', `${slug}.md`);
    const content = readFileSync(mdPath, 'utf-8');
    parts.push(content);
  }

  const body = parts.join('\n\n---\n\n');

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
