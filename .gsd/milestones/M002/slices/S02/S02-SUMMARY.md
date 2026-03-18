---
id: S02
milestone: M002
provides:
  - Fumadocs docs section at /docs/[[...slug]] — sidebar, search, syntax highlighting
  - content/docs/ — 5 MDX files with frontmatter (quickstart, indexer, node, react, next)
  - source.config.ts + lib/source.ts — Fumadocs content pipeline
  - (playground)/ route group — 12 playground pages with independent sidebar layout
  - Minimal root layout with RootProvider (theme + search context)
requires:
  - slice: S01
    provides: apps/docs/ base app
affects: [S03, S04]
key_files:
  - apps/docs/source.config.ts
  - apps/docs/src/lib/source.ts
  - apps/docs/src/app/docs/layout.tsx
  - apps/docs/src/app/docs/[[...slug]]/page.tsx
  - apps/docs/src/app/(playground)/layout.tsx
  - apps/docs/src/app/layout.tsx
  - apps/docs/content/docs/
key_decisions:
  - "Playground routes moved to (playground)/ route group for clean layout separation"
  - "Root layout reduced to Providers + RootProvider; sidebar moved to (playground)/layout.tsx"
  - "fumadocs-mdx v11.10.1 generates single .source/index.ts — tsconfig alias @/.source"
patterns_established:
  - "Route group separation: (playground)/ for sidebar-wrapped pages, docs/ for Fumadocs"
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-T03-SUMMARY.md
duration: 45min
verification_result: pass
completed_at: 2026-03-18T08:30:00Z
---

# S02: Migrate Docs Section to Fumadocs

**Fumadocs powers /docs/* with sidebar, search, and highlighting; playground routes unaffected; build exits 0 with zero TypeScript errors**

## What Was Built

- Fumadocs installed and configured with `source.config.ts` + `lib/source.ts`
- 5 MDX pages migrated from `app/docs/*/page.mdx` to `content/docs/*.mdx` with Fumadocs frontmatter
- Docs section wired with `DocsLayout` + `[[...slug]]/page.tsx` catch-all renderer
- Playground routes moved to `(playground)/` route group with independent sidebar layout
- Root layout simplified to `html/body/Providers/RootProvider`

## Tasks Completed

- T01: Install Fumadocs and configure content source
- T02: Migrate MDX content files
- T03: Wire Fumadocs layout for docs routes

## Verification Evidence

- `pnpm --filter docs build` exits 0, 20 routes rendered (5 docs via SSG + 15 playground static)
- `npx tsc --noEmit` exits 0 (zero TypeScript errors)
- `/docs/[[...slug]]` handles all 5 docs pages
- All 12 playground routes build successfully
