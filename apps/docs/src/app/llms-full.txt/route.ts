import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { NextResponse } from 'next/server';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SLUGS = [
  { slug: 'quickstart', title: 'Quickstart' },
  { slug: 'indexer', title: 'Indexer' },
  { slug: 'node', title: '@lsp-indexer/node' },
  { slug: 'react', title: '@lsp-indexer/react' },
  { slug: 'next', title: '@lsp-indexer/next' },
] as const;

// Resolve public/llm relative to this file's location.
// In standalone output the server runs from .next/standalone — process.cwd() would be wrong.
const LLM_DIR = resolve(__dirname, '../../../../public/llm');

export function GET(): NextResponse {
  const parts: string[] = [];

  for (const { slug } of SLUGS) {
    const mdPath = resolve(LLM_DIR, `${slug}.md`);
    const content = readFileSync(mdPath, 'utf-8');
    parts.push(content);
  }

  const body = parts.join('\n\n---\n\n');

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
