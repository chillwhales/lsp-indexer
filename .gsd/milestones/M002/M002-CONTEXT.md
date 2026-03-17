---
depends_on: [M001]
---

# M002: Docs Site & AI Agent Compatibility

**Gathered:** 2026-03-17
**Status:** Ready for planning

## Project Description

Migrate the test app (`apps/test`) to a proper documentation site (`apps/docs`) built on Fumadocs, and make all package documentation fully consumable by AI agents through the llms.txt standard, per-page `.md` versions, and Context7 MCP indexing.

## Why This Milestone

The current `apps/test` is a dev playground — it has MDX docs and interactive domain pages but no discoverability, no search, no sidebar navigation, and no AI agent compatibility. As the packages are published to npm for external consumption, developers (and their AI coding assistants) need a proper docs site they can reference. AI agents like Claude, Cursor, and Copilot increasingly rely on structured documentation formats (llms.txt, clean markdown, Context7) to give accurate code suggestions. Without these surfaces, any AI agent asked "how do I use @lsp-indexer/react" will hallucinate answers from stale training data instead of pulling current API signatures.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Visit the deployed docs site and browse package documentation with sidebar navigation, search, and table of contents
- Use any of the 12 interactive playground pages (profiles, digital assets, NFTs, etc.) to test hooks live
- Point an AI agent at `{docs-url}/llms.txt` and get a structured overview of all packages
- Fetch `{docs-url}/llms-full.txt` for the complete documentation in a single LLM-friendly file
- Append `.md` to any docs page URL and get a clean markdown version suitable for pasting into ChatGPT/Claude/Cursor
- Use Context7 MCP to query up-to-date @lsp-indexer documentation directly from their coding editor
- Run `pnpm docs:generate-md --check` in CI to verify .md files are in sync with MDX source

### Entry point / environment

- Entry point: `https://{docs-domain}/` (public URL), `http://localhost:3000` (local dev)
- Environment: browser (docs site), CI (--check validation), AI agent tools (llms.txt / Context7)
- Live dependencies involved: Hasura GraphQL (for playground pages), Vercel (deployment)

## Completion Class

- Contract complete means: Fumadocs app builds, all pages render, llms.txt/llms-full.txt routes return valid content, `--check` flag correctly detects stale .md files, context7.json exists in repo root
- Integration complete means: playground pages connect to Hasura and display live data, AI agent can fetch llms.txt and get accurate package information
- Operational complete means: docs site deployed to public URL, Context7 indexes the repo successfully

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- An AI agent (Claude Code or similar) can fetch the llms.txt, understand the 4-package architecture, and produce a working code snippet using @lsp-indexer/react hooks — without hallucinating APIs
- The `generate-md --check` script exits non-zero when an MDX file is modified without regenerating, and exits zero when everything is in sync
- All 12 playground pages render and connect to Hasura in the new app, matching current apps/test functionality

## Risks and Unknowns

- **Fumadocs + existing components compatibility** — The current app uses 16 shadcn/ui components and custom playground components. Fumadocs provides its own UI layer (also Tailwind-based). Need to verify they compose without style conflicts.
- **MDX → MD stripping fidelity** — Custom components like `<Mermaid>`, `<CodeBlock>`, `<CollapsibleSection>` need reliable reverse-mapping to standard markdown. Edge cases in JSX-heavy pages could produce broken output.
- **Playground pages in Fumadocs routing** — Fumadocs uses `content/docs/` convention for file-based routing. The playground pages are React pages with hooks, not MDX content. Need to verify Fumadocs supports mixed routing (docs + app pages).
- **Context7 indexing quality** — Context7 trust scores depend on documentation structure. Need to verify the generated .md files produce high-quality context snippets, not noise.
- **Build time impact** — The generate-md script runs on every build. With 5 docs pages this is trivial, but the architecture should handle growth.

## Existing Codebase / Prior Art

- `apps/test/` — Current Next.js 16 app with 5 MDX doc pages, 12 playground pages, 43 components (16 ui, 6 playground, domain cards, etc.)
- `apps/test/src/app/docs/` — 5 MDX documentation pages (quickstart, node, react, next, indexer) totaling ~1159 lines
- `apps/test/mdx-components.tsx` — Custom MDX component overrides (CodeBlock, Mermaid, heading slugs)
- `apps/test/src/components/` — All UI and domain components that must migrate
- `apps/test/src/app/providers.tsx` — Provider tree (QueryClient, subscriptions, themes)
- `packages/types/`, `packages/node/`, `packages/react/`, `packages/next/` — The 4 packages being documented

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- No existing requirements directly — this milestone introduces new documentation infrastructure
- Advances deferred "SSR hydration examples and documentation" requirement by providing a proper docs site where these can be added

## Scope

### In Scope

- Create `apps/docs` using Fumadocs framework (Next.js App Router)
- Migrate all 5 MDX documentation pages from `apps/test/src/app/docs/`
- Migrate all 12 interactive playground pages from `apps/test/src/app/`
- Migrate all shared components (ui, playground, domain cards, providers)
- Fumadocs features: sidebar navigation, search, table of contents, dark mode
- `/llms.txt` route — structured overview following the llmstxt.org spec format
- `/llms-full.txt` route — complete documentation content in a single file
- `.md` versions of every docs page (URL + `.md` extension) via build-time generation
- `generate-md` script with `--check` flag for CI validation
- `context7.json` in repo root for Context7 MCP indexing
- Add `docs:generate-md` and `docs:generate-md:check` scripts to package.json
- CI workflow step running `--check` to enforce .md freshness
- Delete `apps/test` after migration is verified
- Update all cross-references in AGENTS.md, PROJECT.md, and other docs

### Out of Scope / Non-Goals

- Custom domain setup (deployment URL is fine for now)
- API reference auto-generation from TypeScript source (TypeDoc) — future milestone
- Versioned documentation (only current version)
- Blog section
- i18n / translations
- Docs content rewrite — existing MDX content migrates as-is (formatting adjustments only)

## Technical Constraints

- Fumadocs must work with Next.js 16 (current app version) and React 19
- Existing shadcn/ui components must not conflict with Fumadocs UI layer
- Playground pages need `@lsp-indexer/*` workspace packages — same monorepo dependency graph
- Generated .md files must be committed to the repo (not gitignored) so Context7 can crawl them directly
- The generate-md script must handle: import stripping, JSX component → markdown conversion, frontmatter preservation
- `llms.txt` format must follow the spec: H1 title, blockquote summary, optional sections, H2 file lists with URLs

## Integration Points

- **Fumadocs** — New framework dependency. Provides `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx`. Replaces custom MDX setup and `@next/mdx`.
- **Hasura GraphQL** — Playground pages query Hasura directly (client-side) and via server actions. Same env vars as current app.
- **Context7** — `context7.json` in repo root tells Context7 which folders to index, what to exclude, and rules for AI agents using the docs.
- **CI pipeline** — New workflow step: `pnpm --filter=docs docs:generate-md --check`
- **Vercel** — Deployment target for public docs site. Needs `NEXT_PUBLIC_INDEXER_URL` and `INDEXER_URL` env vars for playground.

## Open Questions

- **Fumadocs version** — Need to verify latest stable version works with Next.js 16 and React 19. Research during planning.
- **Playground routing strategy** — Fumadocs owns `/docs/*`. Playground could live at `/playground/*` as a standard Next.js route group outside Fumadocs, or as a separate Fumadocs docs tree. Research during planning.
- **Landing page** — Current app has a home page with supported domains table. Should this become the Fumadocs landing page, or a separate route? Decide during planning.
- **generate-md component mapping** — Need to catalog all custom MDX components used across the 5 doc pages and define their markdown equivalents. Build the mapping table during planning.
