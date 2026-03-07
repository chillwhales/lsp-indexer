---
phase: quick-1
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - eslint.config.ts
  - .prettierignore
  - packages/node/src/services/creators.ts
  - packages/node/src/services/data-changed-events.ts
  - packages/node/src/services/digital-assets.ts
  - packages/node/src/services/encrypted-assets.ts
  - packages/node/src/services/followers.ts
  - packages/node/src/services/issued-assets.ts
  - packages/node/src/services/nfts.ts
  - packages/node/src/services/owned-assets.ts
  - packages/node/src/services/owned-tokens.ts
  - packages/node/src/services/profiles.ts
  - packages/node/src/services/token-id-data-changed-events.ts
  - packages/node/src/services/universal-receiver-events.ts
  - packages/node/src/subscriptions/client.ts
  - packages/react/src/hooks/factories/create-use-subscription.ts
  - apps/test/src/components/creator-card.tsx
  - apps/test/src/components/follower-card.tsx
  - apps/test/src/components/issued-asset-card.tsx
  - apps/test/src/instrumentation.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - 'pnpm format:check passes with zero warnings'
    - 'pnpm lint passes with zero errors (warnings acceptable)'
    - 'CI workflow (format + lint + build jobs) would pass'
  artifacts:
    - path: 'eslint.config.ts'
      provides: 'ESLint config with proper ignores and rules'
    - path: '.prettierignore'
      provides: 'Prettier ignore with .next/ excluded'
  key_links:
    - from: '.github/workflows/ci.yml'
      to: 'eslint.config.ts'
      via: 'pnpm lint command'
      pattern: 'pnpm lint'
    - from: '.github/workflows/ci.yml'
      to: '.prettierignore'
      via: 'pnpm format:check command'
      pattern: 'pnpm format:check'
---

<objective>
Fix CI pipeline failures: ESLint errors (827 problems), Prettier formatting issues (4 files), and configure lint rules for the codebase.

Purpose: Make CI pass — format:check, lint, and build jobs must all succeed.
Output: Clean ESLint config, formatted code, zero lint errors.
</objective>

<execution_context>
@/home/coder/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/coder/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@eslint.config.ts
@.prettierignore
@.prettierrc
@.github/workflows/ci.yml
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix ESLint config and Prettier ignores</name>
  <files>eslint.config.ts, .prettierignore</files>
  <action>
**ESLint config (`eslint.config.ts`):**

1. Add these to the global `ignores` array:

   - `'**/.next/'` — Next.js build output (171 parsing errors + ~100 generated code errors)
   - `'**/.planning/'` — GSD planning docs (not source code)
   - `'**/postcss.config.mjs'` — PostCSS config not in any tsconfig project

2. Add/update these rules in the shared settings `rules` object:
   - `'no-duplicate-imports': 'off'` — REPLACE the existing `'error'`. This rule doesn't understand TypeScript `import type` vs `import` from the same module. `prettier-plugin-organize-imports` handles import organization. This eliminates 63 errors.
   - `'@typescript-eslint/no-empty-object-type': ['error', { allowObjectTypes: 'always' }]` — ADD this rule. `{}` is used intentionally in conditional types throughout `packages/types/src/` (e.g., `I extends { field: true } ? { field: Type } : {}`). This eliminates 77 errors.
   - `'@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }]` — REPLACE the existing `'error'`. React event handlers and component props commonly pass Promise-returning functions where void is expected. This is safe in React. Eliminates 12 errors.
   - `'@typescript-eslint/no-base-to-string': 'warn'` — ADD this rule. Demote from error to warning. The `String(error)` pattern in subscription error normalization is intentional (errors may be objects). Eliminates 14 blocking errors.

**Prettier ignore (`.prettierignore`):**

3. Add these lines to `.prettierignore`:

   - `.next/` — Next.js build output
   - `.planning/` — GSD planning docs (formatting changes create noise in diffs)
   - `dist/` — Build output

4. Run `pnpm format` to fix the 2 remaining source files (`apps/test/tsconfig.json`, `packages/node/schema.graphql`).

**IMPORTANT:** Do NOT change any rules to `off` that protect code quality (no-floating-promises, no-unused-vars, explicit-function-return-type). Only adjust rules where the current config creates false positives for valid TypeScript patterns.
</action>
<verify>
Run `pnpm format:check` — must pass with zero warnings.
Run `pnpm lint 2>&1 | tail -5` — check error count is drastically reduced (target: 0 errors, warnings acceptable).
</verify>
<done>
`pnpm format:check` passes. `pnpm lint` reports 0 errors (warnings for no-explicit-any, explicit-function-return-type, etc. are acceptable).
</done>
</task>

<task type="auto">
  <name>Task 2: Fix remaining source code lint errors</name>
  <files>
packages/node/src/services/creators.ts
packages/node/src/services/data-changed-events.ts
packages/node/src/services/digital-assets.ts
packages/node/src/services/encrypted-assets.ts
packages/node/src/services/followers.ts
packages/node/src/services/issued-assets.ts
packages/node/src/services/nfts.ts
packages/node/src/services/owned-assets.ts
packages/node/src/services/owned-tokens.ts
packages/node/src/services/profiles.ts
packages/node/src/services/token-id-data-changed-events.ts
packages/node/src/services/universal-receiver-events.ts
packages/node/src/subscriptions/client.ts
packages/react/src/hooks/factories/create-use-subscription.ts
apps/test/src/components/creator-card.tsx
apps/test/src/components/follower-card.tsx
apps/test/src/components/issued-asset-card.tsx
apps/test/src/instrumentation.ts
  </files>
  <action>
Fix the remaining source code lint errors that can't be solved by config changes:

**1. `no-unnecessary-type-assertion` (13 files in packages/node/src/services/):**
Each service file has a pattern like `conditions[0]!` in the `buildXxxWhere` function. The `!` non-null assertion is unnecessary because TypeScript already knows `conditions[0]` is defined after checking `conditions.length === 1`. Remove the `!` from `conditions[0]!` in each file:

- `if (conditions.length === 1) return conditions[0]!;` → `if (conditions.length === 1) return conditions[0];`
  Files: creators.ts, data-changed-events.ts, digital-assets.ts, encrypted-assets.ts, followers.ts, issued-assets.ts, nfts.ts, owned-assets.ts, owned-tokens.ts, profiles.ts, token-id-data-changed-events.ts, universal-receiver-events.ts

**2. `no-unused-vars` (3 files in apps/test/src/components/):**
Rename unused `index` parameter to `_index` in function signatures:

- `apps/test/src/components/creator-card.tsx` line 22: `{ creator, index }` → `{ creator, index: _index }` (or remove if not used in JSX)
- `apps/test/src/components/follower-card.tsx` line 17: `{ follower, index }` → `{ follower, index: _index }` (or remove if not used in JSX)
- `apps/test/src/components/issued-asset-card.tsx` line 22: `{ issuer, index }` → `{ issuer, index: _index }` (or remove if not used in JSX)
  Check each file — if `index` is used anywhere in the component body, it's NOT unused and the error is about something else. If truly unused, prefix with `_`.

**3. `no-floating-promises` (2 files):**

- `packages/node/src/subscriptions/client.ts` — add `void` operator before the unhandled promise
- `packages/react/src/hooks/factories/create-use-subscription.ts` — add `void` operator before the unhandled promise

**4. `no-console` (1 file):**

- `apps/test/src/instrumentation.ts` — change `console.log` to `console.info` (which is in the allowed list)

After all fixes, run `pnpm format` to ensure Prettier consistency.
</action>
<verify>
Run `pnpm lint 2>&1 | grep -c "error"` — must return only the summary line count of 0 errors.
Run `pnpm lint 2>&1 | tail -3` — should show "0 errors" in the summary.
Run `pnpm format:check` — must still pass.
</verify>
<done>
`pnpm lint` passes with 0 errors. `pnpm format:check` passes. All source code issues resolved. Only warnings remain (no-explicit-any, explicit-function-return-type — these are intentional as warn level).
</done>
</task>

</tasks>

<verification>
1. `pnpm format:check` exits 0 (no formatting issues)
2. `pnpm lint` exits 0 (no errors — warnings acceptable)
3. `pnpm --filter='!test' build` exits 0 (build still works)
</verification>

<success_criteria>

- CI format job passes: `pnpm format:check` exits 0
- CI lint job passes: `pnpm lint` exits 0
- CI build job passes: `pnpm --filter='!test' build` exits 0
- No source code quality regressions (rules still enforce important patterns)
  </success_criteria>

<output>
After completion, create `.planning/quick/1-fix-ci-linter-and-prettier/1-SUMMARY.md`
</output>
