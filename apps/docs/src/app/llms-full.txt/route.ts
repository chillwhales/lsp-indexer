import { readFileSync } from 'fs';
import { resolve } from 'path';

import { NextResponse } from 'next/server';

const SLUGS = [
  { slug: 'quickstart', title: 'Quickstart' },
  { slug: 'indexer', title: 'Indexer' },
  { slug: 'node', title: '@lsp-indexer/node' },
  { slug: 'react', title: '@lsp-indexer/react' },
  { slug: 'next', title: '@lsp-indexer/next' },
] as const;

// In standalone output, server.js calls process.chdir(__dirname) so
// process.cwd() === the app directory at runtime, making this path correct
// both locally (cwd = apps/docs/) and in the Docker image.
const LLM_DIR = resolve(process.cwd(), 'public/llm');

export function GET(): NextResponse {
  const parts: string[] = [];

  for (const { slug } of SLUGS) {
    const content = readFileSync(resolve(LLM_DIR, `${slug}.md`), 'utf-8');
    parts.push(content);
  }

  const body = parts.join('\n\n---\n\n');

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
