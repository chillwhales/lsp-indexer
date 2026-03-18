#!/usr/bin/env node
// generate-md.mjs
// Reads content/docs/{slug}.mdx, strips frontmatter, prepends # {title}, writes public/llm/{slug}.md
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

/** Strip leading YAML frontmatter block (---\n...\n---\n) and trim leading whitespace. */
function stripFrontmatter(content) {
  const stripped = content.replace(/^---[\s\S]*?---\n*/, '');
  return stripped.trimStart();
}

/** Build final .md content: auto-generated comment + frontmatter + body */
function buildMd(content, slug) {
  const body = stripFrontmatter(content);
  const frontmatterMatch = content.match(/^(---[\s\S]*?---)\n*/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
  const comment = `<!-- This file is auto-generated from content/docs/${slug}.mdx — do not edit directly. Run \`pnpm --filter docs generate\` to regenerate. -->`;
  return frontmatter ? `${comment}\n\n${frontmatter}\n\n${body}` : `${comment}\n\n${body}`;
}

const stale = [];

for (const slug of SLUGS) {
  const mdxPath = resolve(ROOT, 'content/docs', `${slug}.mdx`);
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
