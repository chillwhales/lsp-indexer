# M002: Docs Site & AI Agent Compatibility

**Vision:** Migrate `apps/test` to `apps/docs` — the public-facing developer hub for `@lsp-indexer`. The app already has 12 domain playground pages, a custom docs section, and a Dockerfile deployment setup. This milestone renames it, upgrades the docs section to Fumadocs (proper sidebar, search, syntax highlighting), and adds AI-compatibility artifacts (llms.txt, llms-full.txt, per-page .md sidecars, context7.json) so LLM tools and MCP clients can consume the documentation programmatically. The playground stays intact and coexists with the improved docs section.

## Success Criteria

- `apps/test` is renamed to `apps/docs` with package name `docs` — all references updated (pnpm-workspace.yaml, Dockerfile, docker-compose.yml, CI)
- The 12 domain playground pages are fully functional in `apps/docs` (all hooks, filters, sorts, includes work as before)
- The docs section is powered by Fumadocs: sidebar navigation, full-text search, syntax highlighting, dark mode — replacing the current custom `@next/mdx` + prose layout
- All 5 docs pages (Quickstart, Indexer, Node, React, Next) render correctly under Fumadocs
- `GET /llms.txt` returns a concise project summary for LLMs
- `GET /llms-full.txt` returns all 5 docs pages concatenated
- `GET /llm/[slug].md` returns raw markdown for each of the 5 pages (collision-free path, outside Fumadocs routes)
- `context7.json` exists at `public/context7.json` formatted for Context7 MCP indexing
- `pnpm --filter docs generate:check` exits 0 in clean state and non-zero when any sidecar drifts from its MDX source
- `pnpm --filter docs build` exits 0; `apps/test` is removed

## Key Risks / Unknowns

- Fumadocs integrating alongside the existing custom Next.js app — Fumadocs has opinions about layout, routing, and providers. The risk is conflicts with the current sidebar, providers.tsx, and `app/layout.tsx` that serve the playground.
- The existing `app/docs/layout.tsx` custom layout vs. Fumadocs `DocsLayout` — Fumadocs needs its own layout subtree that may conflict with the root sidebar layout wrapping everything.

## Proof Strategy

- Fumadocs layout conflict risk → retire in S02 by running the full app with both the playground sidebar and the Fumadocs docs section active in the same Next.js app — playground routes and docs routes both rendering correctly in a browser at the same time.

## Verification Classes

- Contract verification: `pnpm --filter docs build` exits 0 with zero TypeScript errors
- Integration verification: all 12 playground pages render with real hooks in a running dev server; all 5 docs pages render under Fumadocs
- Operational verification: Dockerfile builds; docker-compose.yml references correct paths
- UAT / human verification: human navigates playground domains and docs pages, confirms Fumadocs search works, sidebar is correct

## Milestone Definition of Done

This milestone is complete only when all are true:

- `apps/docs` exists; `apps/test` directory is removed
- `pnpm --filter docs build` exits 0
- All 12 playground pages functional in dev server
- All 5 docs pages render under Fumadocs
- `/llms.txt`, `/llms-full.txt`, `/llm/quickstart.md` return expected content in dev server
- `public/context7.json` exists and is valid JSON
- `pnpm --filter docs generate:check` exits 0 clean, non-zero on stale sidecar
- Dockerfile and docker-compose.yml updated to reference `apps/docs`
- CI references updated

## Requirement Coverage

- Covers: none currently in REQUIREMENTS.md (M001 cleared them all) — this milestone creates new public-facing capability
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: Rename apps/test → apps/docs** `risk:low` `depends:[]`
  > After this: `apps/test` is gone, `apps/docs` exists with package name `docs`, `pnpm --filter docs build` exits 0, and the app runs identically to before at `http://localhost:3001` — all 12 playground pages functional, docs layout unchanged, Dockerfile and docker-compose.yml updated.

- [x] **S02: Migrate Docs Section to Fumadocs** `risk:high` `depends:[S01]`
  > After this: The docs section at `/docs/*` is powered by Fumadocs with proper sidebar navigation, full-text search, and syntax highlighting. All 5 docs pages render correctly. The playground sidebar and playground routes continue to work alongside Fumadocs. Proven by running `pnpm --filter docs dev` and navigating both playground and docs routes in a browser.

- [x] **S03: AI Compatibility — llms.txt, llms-full.txt, .md Sidecars** `risk:medium` `depends:[S02]`
  > After this: `curl http://localhost:3001/llms.txt` returns a project summary, `curl http://localhost:3001/llms-full.txt` returns all docs concatenated, and `curl http://localhost:3001/llm/quickstart.md` returns raw markdown — all served from `public/llm/` static files (no Fumadocs route collision).

- [x] **S04: context7.json + CI Sidecar Validation** `risk:low` `depends:[S03]`
  > After this: `public/context7.json` lists all 5 doc pages in Context7 format, `pnpm --filter docs generate:check` exits 0 on a clean repo and exits 1 when a `.mdx` source diverges from its sidecar output — with the check wired into CI.

## Boundary Map

### S01 → S02

Produces:
- `apps/docs/` — complete working app with all 12 playground pages and current docs layout
- `apps/docs/package.json` — name: `docs`
- `apps/docs/Dockerfile`, `apps/docs/docker-compose.yml` — updated paths
- All CI references updated to `apps/docs`
- `pnpm-workspace.yaml` — still uses `apps/*` glob (no change needed, but verified)

Consumes:
- nothing (first slice — pure rename)

### S02 → S03

Produces:
- `apps/docs/app/docs/layout.tsx` — replaced with Fumadocs `DocsLayout`
- `apps/docs/app/docs/[[...slug]]/page.tsx` — Fumadocs catch-all renderer (replaces 5 individual `page.mdx` dirs)
- `apps/docs/content/docs/` — MDX files with Fumadocs frontmatter (migrated from `app/docs/*/page.mdx`)
- `apps/docs/source.config.ts` — Fumadocs content source
- Working Fumadocs search at `/docs/*`
- `pnpm --filter docs build` exits 0

Consumes from S01:
- `apps/docs/` base app — providers.tsx, root layout, nav sidebar for playground routes

### S03 → S04

Produces:
- `apps/docs/app/llms.txt/route.ts` — GET handler returning project summary; per-page links reference `/llm/{slug}.md`
- `apps/docs/app/llms-full.txt/route.ts` — GET handler reading from `public/llm/` and concatenating
- `apps/docs/scripts/generate-md.mjs` — default: writes `public/llm/{slug}.md`; `--check`: exits 1 if any file is stale or missing
- `apps/docs/public/llm/*.md` — 5 static files committed to repo, served by Next.js at `/llm/{slug}.md`
- `"generate"` and `"generate:check"` scripts in `apps/docs/package.json`
- Verified: `GET /llms.txt`, `GET /llms-full.txt`, `GET /llm/quickstart.md` return expected content

Consumes from S02:
- `apps/docs/content/docs/` MDX files — generate script reads these as source

### S04 → (done)

Produces:
- `apps/docs/public/context7.json` — Context7 MCP library index
- CI job/step running `pnpm --filter docs generate:check` on every PR
- Verified: stale sidecar causes CI job to fail with slug name in output

Consumes from S03:
- `apps/docs/scripts/generate-md.mjs` with `--check` flag
- `public/llm/*.md` static files (committed, checked in CI)
