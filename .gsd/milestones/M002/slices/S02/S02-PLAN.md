# S02: Migrate Docs Section to Fumadocs

**Goal:** Replace the current custom `@next/mdx` docs layout in `apps/docs` with Fumadocs — giving the docs section a proper sidebar, full-text search, and syntax highlighting — while keeping the existing playground routes and sidebar fully functional alongside it.
**Demo:** `pnpm --filter docs dev` running — navigate to `/docs/quickstart` and see the Fumadocs layout with sidebar nav, search bar, and syntax-highlighted code blocks. Then navigate to `/profiles` and see the playground page working exactly as before. Both coexist in the same Next.js app.

## Must-Haves

- `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx` installed
- `apps/docs/app/docs/layout.tsx` uses Fumadocs `DocsLayout` (not the previous custom prose layout)
- `apps/docs/app/docs/[[...slug]]/page.tsx` renders MDX via Fumadocs catch-all
- `apps/docs/content/docs/` contains the 5 migrated MDX files with Fumadocs frontmatter
- `apps/docs/source.config.ts` defines the docs collection
- All 5 pages render under Fumadocs with correct sidebar order: Quickstart → Indexer → Node → React → Next
- Playground sidebar and all 12 playground routes unaffected
- `pnpm --filter docs build` exits 0 with zero TypeScript errors
- The current per-domain `app/docs/*/page.mdx` dirs are removed (replaced by catch-all)

## Proof Level

- This slice proves: integration — Fumadocs docs layout and existing playground coexist in the same Next.js app
- Real runtime required: yes (dev server confirms both subsystems render)
- Human/UAT required: yes — confirm Fumadocs search works, sidebar order is correct, code highlighting renders

## Verification

- `pnpm --filter docs build` exits 0 with no TypeScript errors (`pnpm tsc --noEmit`)
- In dev server: `/docs/quickstart` returns 200 and renders Fumadocs chrome (sidebar visible in HTML)
- In dev server: `/profiles` still returns 200 and renders the playground page

## Observability / Diagnostics

- Runtime signals: Next.js build output — MDX parse errors surface as build failures with file + line
- Inspection surfaces: browser at `localhost:3001/docs/*` and `localhost:3001/profiles`
- Failure visibility: Fumadocs `DocsLayout` import errors or MDX frontmatter issues are fatal at build time

## Integration Closure

- Upstream surfaces consumed: `apps/docs/` base app from S01 — root layout, providers.tsx, nav sidebar
- New wiring: `app/docs/layout.tsx` switches to Fumadocs layout subtree; catch-all page renderer wired to `source.config.ts`
- What remains: AI compatibility surfaces (S03), context7 + validation (S04)

## Tasks

- [x] **T01: Install Fumadocs and configure content source** `est:30m`
  - Why: Fumadocs needs a content source config (`source.config.ts`) and the MDX content to be in the right location before the layout can render anything
  - Files: `apps/docs/package.json`, `apps/docs/next.config.ts`, `apps/docs/source.config.ts`, `apps/docs/lib/source.ts`
  - Do: (1) Add `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx` to `apps/docs/package.json` deps. (2) Update `apps/docs/next.config.ts` to use `createMDX` from `fumadocs-mdx/config` instead of (or alongside) `@next/mdx`. (3) Create `apps/docs/source.config.ts` using `defineCollections` + `defineConfig` from `fumadocs-mdx/config` — define a `docs` collection pointing at `./content/docs`. (4) Create `apps/docs/lib/source.ts` that loads the collection via `loader` from `fumadocs-core/source`. (5) Run `pnpm install`.
  - Verify: `pnpm --filter docs build` exits 0 (even before migrating content)
  - Done when: Fumadocs deps installed, source config compiles, build passes

- [x] **T02: Migrate MDX content files** `est:20m`
  - Why: The existing 5 MDX pages live in `app/docs/*/page.mdx` — they need to move to `content/docs/*.mdx` with Fumadocs-compatible frontmatter
  - Files: `apps/docs/content/docs/quickstart.mdx`, `indexer.mdx`, `node.mdx`, `react.mdx`, `next.mdx`, `apps/docs/content/docs/meta.json`
  - Do: (1) Create `apps/docs/content/docs/` directory. (2) For each of the 5 docs pages, copy content from `apps/docs/app/docs/{name}/page.mdx` to `apps/docs/content/docs/{name}.mdx` — add frontmatter `title` and `description`. Handle mermaid diagrams: if `fumadocs-mdx` supports remark-mermaid, add the plugin; otherwise convert mermaid blocks to static SVG or a client component. (3) Create `apps/docs/content/docs/meta.json` with `{ "pages": ["quickstart", "indexer", "node", "react", "next"] }` for sidebar order. (4) Delete the old `apps/docs/app/docs/{quickstart,indexer,node,react,next}/` directories. (5) Run `pnpm --filter docs build`.
  - Verify: Build exits 0; no missing-file errors for the old page.mdx paths
  - Done when: Content migrated, old dirs removed, build passes

- [x] **T03: Wire Fumadocs layout for docs routes** `est:30m`
  - Why: The docs subtree (`/docs/*`) needs its own layout using `DocsLayout` from `fumadocs-ui` — this replaces the current custom prose layout without touching the root layout that serves the playground
  - Files: `apps/docs/app/docs/layout.tsx`, `apps/docs/app/docs/[[...slug]]/page.tsx`, `apps/docs/app/layout.tsx` (check for RootProvider), `apps/docs/app/globals.css` (add Fumadocs theme)
  - Do: (1) Replace `apps/docs/app/docs/layout.tsx` with a Fumadocs `DocsLayout` that takes `tree` from `source.pageTree`. Import `RootProvider` from `fumadocs-ui/provider` — if it's not already in the root layout, add it there (it must wrap the entire app). (2) Create (or replace) `apps/docs/app/docs/[[...slug]]/page.tsx` as the Fumadocs catch-all: call `source.getPage(params.slug)` and render with `DocsPage` + `DocsBody` from `fumadocs-ui`. (3) Import Fumadocs CSS (`fumadocs-ui/style.css`) in `globals.css` or the layout. (4) Run dev server, navigate to `/docs/quickstart` and confirm Fumadocs sidebar and content render. (5) Navigate to `/profiles` and confirm playground still works.
  - Verify: Both `/docs/quickstart` and `/profiles` return 200 in dev server; `pnpm --filter docs build` exits 0 with no TypeScript errors
  - Done when: Fumadocs docs layout renders at `/docs/*` and playground routes unaffected

## Files Likely Touched

- `apps/docs/package.json` (add fumadocs deps)
- `apps/docs/next.config.ts` (update MDX config)
- `apps/docs/source.config.ts` (new)
- `apps/docs/lib/source.ts` (new)
- `apps/docs/content/docs/*.mdx` (5 files, new)
- `apps/docs/content/docs/meta.json` (new)
- `apps/docs/app/docs/layout.tsx` (replace with Fumadocs)
- `apps/docs/app/docs/[[...slug]]/page.tsx` (new catch-all)
- `apps/docs/app/docs/{quickstart,indexer,node,react,next}/page.mdx` (deleted)
- `apps/docs/app/layout.tsx` (add RootProvider if needed)
- `apps/docs/app/globals.css` (Fumadocs CSS import)
- `pnpm-lock.yaml`
