# S04: context7.json + CI Sidecar Validation

**Goal:** Add `public/context7.json` for Context7 MCP library indexing, and wire the sidecar check script from S03 into CI so that PRs fail if `.md` sidecars are not committed and up to date.
**Demo:** (1) `python3 -m json.tool apps/docs/public/context7.json` exits 0 — valid JSON with `libraryId`, `title`, `description`, `pages` array with 5 entries. (2) `pnpm --filter docs generate:check` exits 0 on a clean repo. (3) In CI: push a PR where `content/docs/quickstart.mdx` was changed but `public/llm/quickstart.md` was not regenerated — the CI `docs-check` job fails with a clear error naming the stale file.

## Must-Haves

- `apps/docs/public/context7.json` — valid JSON with `libraryId`, `version`, `title`, `description`, `pages` array (5 entries with `url`, `title`, `description`)
- CI job/step runs `pnpm --filter docs generate:check` on every PR and exits non-zero on stale sidecars
- `pnpm --filter docs build` still exits 0

## Verification

- `python3 -m json.tool apps/docs/public/context7.json` exits 0; file has 5 entries in `pages`
- `pnpm --filter docs generate:check` exits 0 on clean state
- Modify `content/docs/quickstart.mdx` without re-running generate, run `generate:check` — exits 1 naming `quickstart`
- CI workflow file contains a step/job that runs `pnpm --filter docs generate:check`

## Tasks

- [x] **T01: Create context7.json** `est:15m`
  - Why: Enables Context7 MCP to index `@lsp-indexer` so AI tools can discover and fetch docs via `resolve_library` / `get_library_docs`
  - Files: `apps/docs/public/context7.json`
  - Do: (1) Fetch `https://context7.com/docs` or inspect an existing library's context7.json to confirm the schema (expected fields: `libraryId`, `version`, `title`, `description`, `pages[]` with `url`, `title`, `description`). (2) Write `apps/docs/public/context7.json` — use `libraryId: "chillwhales/lsp-indexer"`, `version` matching current `@lsp-indexer/node` version from `packages/node/package.json`. List all 5 pages with deployed URLs (`https://lsp-indexer.chillwhales.io/docs/{slug}` — use this as placeholder; update when domain is finalized). (3) Validate: `python3 -m json.tool apps/docs/public/context7.json`.
  - Verify: JSON is valid; has `libraryId`, `version`, `title`, `description`, 5-entry `pages` array
  - Done when: File exists, parses cleanly, has correct structure

- [x] **T02: Wire generate:check into CI** `est:15m`
  - Why: Prevents stale `.md` sidecars from ever merging — the script from S03 already does the check; this just plugs it into the PR gate
  - Files: `.github/workflows/ci.yml`
  - Do: (1) Open `.github/workflows/ci.yml`. Add a new job `docs-check` (or an additional step in an existing build job). The job should: check out the repo, install deps (`pnpm install --frozen-lockfile`), run `pnpm --filter docs generate:check`. If this job is a separate entry, give it `needs: []` so it runs in parallel with other CI jobs — it's fast and has no dependencies. (2) The job fails loudly if sidecars are stale — the script already prints which slugs need updating and exits 1. (3) Consider adding a comment in the job explaining that developers must run `pnpm --filter docs generate` and commit the updated `.md` files whenever they change an MDX source.
  - Verify: CI workflow file has a job/step with `pnpm --filter docs generate:check`; running it locally on clean state exits 0
  - Done when: CI step present and verified to pass on clean state

## Files Likely Touched

- `apps/docs/public/context7.json` (new)
- `.github/workflows/ci.yml` (add docs-check step/job)
