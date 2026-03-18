/**
 * generate-md.ts
 *
 * Reads src/app/docs/{slug}/page.mdx and writes a plain-markdown sidecar to
 * public/llm/{slug}.md so that AI tools (Context7, llms.txt crawlers, etc.) can
 * consume the docs without running the Next.js server.
 *
 * Usage:
 *   pnpm --filter docs generate          -- write all sidecars
 *   pnpm --filter docs generate:check    -- exit 1 if any sidecar is missing or stale
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SLUGS = ['quickstart', 'indexer', 'node', 'react', 'next'] as const;
type Slug = (typeof SLUGS)[number];

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LLM_DIR = resolve(ROOT, 'public/llm');
const isCheck = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mdxPath(slug: Slug): string {
  return resolve(ROOT, 'src/app/docs', slug, 'page.mdx');
}

function sidecarPath(slug: Slug): string {
  return resolve(LLM_DIR, `${slug}.md`);
}

/**
 * Prepend an auto-generated comment to the raw MDX content.
 * The comment tells editors not to modify the file directly.
 */
function buildSidecar(slug: Slug, mdxContent: string): string {
  const header = [
    `<!-- This file is auto-generated from src/app/docs/${slug}/page.mdx.`,
    `     Do not edit directly — run \`pnpm --filter docs generate\` to regenerate. -->`,
  ].join('\n');
  return `${header}\n\n${mdxContent}`;
}

// ---------------------------------------------------------------------------
// Generate mode
// ---------------------------------------------------------------------------

function generate(): void {
  mkdirSync(LLM_DIR, { recursive: true });

  for (const slug of SLUGS) {
    const content = readFileSync(mdxPath(slug), 'utf-8');
    writeFileSync(sidecarPath(slug), buildSidecar(slug, content), 'utf-8');
    console.info(`  wrote public/llm/${slug}.md`);
  }

  console.info(`Generated ${SLUGS.length} sidecars in public/llm/`);
}

// ---------------------------------------------------------------------------
// Check mode
// ---------------------------------------------------------------------------

function check(): void {
  const stale: string[] = [];

  for (const slug of SLUGS) {
    const expected = buildSidecar(slug, readFileSync(mdxPath(slug), 'utf-8'));

    let actual: string;
    try {
      actual = readFileSync(sidecarPath(slug), 'utf-8');
    } catch {
      stale.push(`${slug} (missing)`);
      continue;
    }

    if (actual !== expected) {
      stale.push(`${slug} (needs update)`);
    }
  }

  if (stale.length > 0) {
    console.error('Stale sidecars — run `pnpm --filter docs generate` to update:');
    for (const entry of stale) {
      console.error(`  ${entry}`);
    }
    process.exit(1);
  }

  console.info('All sidecars up to date');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (isCheck) {
  check();
} else {
  generate();
}
