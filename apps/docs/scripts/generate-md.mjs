#!/usr/bin/env node
// generate-md.mjs
// Reads src/app/docs/{slug}/page.mdx, writes public/llm/{slug}.md
// Usage:
//   node scripts/generate-md.mjs            -- generate mode: write all .md files
//   node scripts/generate-md.mjs --check    -- check mode: exit 1 if any file is stale

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SLUGS = ['quickstart', 'indexer', 'node', 'react', 'next'];
const isCheck = process.argv.includes('--check');

/** Build .md content: auto-generated comment + original content. */
function buildMd(content, slug) {
  const comment = `<!-- This file is auto-generated from src/app/docs/${slug}/page.mdx — do not edit directly. Run \`pnpm --filter docs generate\` to regenerate. -->`;
  return `${comment}\n\n${content}`;
}

const stale = [];

for (const slug of SLUGS) {
  const mdxPath = resolve(ROOT, 'src/app/docs', slug, 'page.mdx');
  const mdPath = resolve(ROOT, 'public/llm', `${slug}.md`);

  const mdxContent = readFileSync(mdxPath, 'utf-8');
  const final = buildMd(mdxContent, slug);

  if (isCheck) {
    let existing;
    try {
      existing = readFileSync(mdPath, 'utf-8');
    } catch {
      stale.push(`${slug} (missing)`);
      continue;
    }
    if (existing !== final) {
      stale.push(`${slug} (needs update)`);
    }
  } else {
    mkdirSync(resolve(ROOT, 'public/llm'), { recursive: true });
    writeFileSync(mdPath, final, 'utf-8');
    console.log(`  wrote public/llm/${slug}.md`);
  }
}

if (isCheck) {
  if (stale.length > 0) {
    console.error('Stale sidecars found — run `pnpm --filter docs generate` to update:');
    for (const s of stale) {
      console.error(`  ${s}`);
    }
    process.exit(1);
  } else {
    console.log('All sidecars up to date');
    process.exit(0);
  }
} else {
  console.log(`Generated ${SLUGS.length} .md files in public/llm/`);
}
