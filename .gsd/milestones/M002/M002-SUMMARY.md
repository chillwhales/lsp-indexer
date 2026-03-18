# M002: Docs Site & AI Agent Compatibility — Milestone Summary

**Status:** ✅ Complete  
**Completed:** 2026-03-18

## What Was Delivered

### S01: Rename apps/test → apps/docs ✅
`apps/test` renamed to `apps/docs` with package name `docs`. Dockerfile, docker-compose.yml, and pnpm-lock.yaml updated. Build passes unchanged.

### S02: Migrate Docs Section to Fumadocs ✅
Fumadocs (v14.7.7) installed and configured. 5 MDX docs pages migrated to `content/docs/`. Docs section at `/docs/*` powered by `DocsLayout` + `[[...slug]]` catch-all. Playground routes moved to `(playground)/` route group with independent sidebar layout. Root layout simplified. Zero TypeScript errors.

### S03: AI Compatibility ✅
`scripts/generate-md.mjs` generates `public/llm/{slug}.md` from MDX sources (frontmatter stripped, title prepended). `GET /llms.txt` returns project summary + per-page links. `GET /llms-full.txt` returns all 5 docs concatenated. Both scripts wired as `pnpm --filter docs generate` and `generate:check`.

### S04: context7.json + CI Sidecar Validation ✅
`public/context7.json` lists all 5 doc pages in Context7 MCP format (libraryId: `chillwhales/lsp-indexer`). CI `docs-check` job runs `generate:check` on every PR. `ci-pass` gate updated to require it.

## Key Outputs

- `apps/docs/` — complete docs + playground app
- `apps/docs/content/docs/*.mdx` — 5 Fumadocs-powered docs pages
- `apps/docs/public/llm/*.md` — 5 static AI-readable markdown files
- `apps/docs/public/context7.json` — Context7 MCP library index
- `apps/docs/src/app/llms.txt/` + `llms-full.txt/` — AI agent discovery endpoints
- `.github/workflows/ci.yml` — docs-check sidecar freshness job
