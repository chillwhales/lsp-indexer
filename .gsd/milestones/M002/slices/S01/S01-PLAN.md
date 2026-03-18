# S01: Rename apps/test → apps/docs

**Goal:** Rename the entire `apps/test` directory to `apps/docs` and update all references so the app is identical in behavior under its new name — package name `docs`, Dockerfile updated, docker-compose.yml updated, CI references updated.
**Demo:** `pnpm --filter docs build` exits 0. `pnpm --filter docs dev` starts the app. All 12 playground pages load. `apps/test` no longer exists.

## Must-Haves

- `apps/test` directory is gone; `apps/docs` is present
- `apps/docs/package.json` has `"name": "docs"`
- `pnpm --filter docs build` exits 0
- `apps/docs/Dockerfile` build instruction paths reference `apps/docs` where needed
- `apps/docs/docker-compose.yml` references updated
- Any hardcoded `apps/test` references in CI workflows updated
- `pnpm-workspace.yaml` still picks up `apps/docs` (via `apps/*` glob — verify, no change expected)

## Verification

- `pnpm --filter docs build` exits 0
- `ls apps/test` returns non-zero (directory gone)
- `grep -r "apps/test" .github/ apps/docs/` returns no hits

## Tasks

- [ ] **T01: Rename directory and update all references** `est:20m`
  - Why: Clean rename with zero behavior change — makes the app's purpose clear and sets up S02–S04
  - Files: `apps/docs/package.json`, `apps/docs/Dockerfile`, `apps/docs/docker-compose.yml`, `.github/workflows/*.yml` (if any reference `apps/test`), `pnpm-lock.yaml` (regenerated)
  - Do: (1) `mv apps/test apps/docs`. (2) Update `apps/docs/package.json` — change `"name": "test"` to `"name": "docs"`. (3) Check `apps/docs/Dockerfile` for any hardcoded `apps/test` path strings and update to `apps/docs`. (4) Update `apps/docs/docker-compose.yml` service name from `test-app` to `docs-app` (optional cosmetic, but good hygiene). (5) Grep `.github/workflows/` for any `apps/test` references and update. (6) Grep root-level config files (`turbo.json` if present, etc.) for `apps/test`. (7) Run `pnpm install` to regenerate lockfile with new package name. (8) Run `pnpm --filter docs build`.
  - Verify: `pnpm --filter docs build` exits 0; `ls apps/test` fails; grep finds no stale references
  - Done when: build passes and no `apps/test` references remain

## Files Likely Touched

- `apps/docs/package.json` (rename only: `"name": "docs"`)
- `apps/docs/Dockerfile` (if any path references `apps/test`)
- `apps/docs/docker-compose.yml` (service name update)
- `.github/workflows/*.yml` (if referencing `apps/test`)
- `pnpm-lock.yaml` (auto-regenerated)
