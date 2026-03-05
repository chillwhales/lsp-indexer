---
phase: 11-server-actions-publish-readiness
verified: 2026-03-05T15:10:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 11: Server Actions & Publish Readiness Verification Report

**Phase Goal:** Developer can use `@lsp-indexer/next` server actions for all domains from Next.js Server Components, and all 4 packages pass publish validation checks.
**Verified:** 2026-03-05T15:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                    | Status     | Evidence                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Developer gets an IndexerError with category VALIDATION when passing invalid inputs to any server action | ✓ VERIFIED | `packages/types/src/errors.ts` has `'VALIDATION'` in IndexerErrorCategory union (L11); `'VALIDATION_FAILED'` in IndexerErrorCode (L43); `packages/node/src/errors/indexer-error.ts` has `fromValidationError` factory (L211-228) that creates IndexerError with category `'VALIDATION'` and code `'VALIDATION_FAILED'` |
| 2   | Validation error message includes Zod field-level details showing which input was wrong                  | ✓ VERIFIED | `fromValidationError` maps Zod issues to `validationErrors` array with `path` and `message` fields (L215-218), formats them into the error message with field paths (L220-225), and `toJSON()` includes `validationErrors` (L63)                                                                                       |
| 3   | Valid inputs pass through validation transparently — no behavior change for correct usage                | ✓ VERIFIED | `validate.ts` uses `schema.safeParse(input)` (L18) — on success returns `result.data` (L22) without modification, only throws on `!result.success`                                                                                                                                                                     |
| 4   | All 21 exported server action functions validate their inputs before calling service functions           | ✓ VERIFIED | grep confirms exactly 21 `validateInput(` calls across 12 action files (excluding imports/validate.ts itself). Each call is the first line of the implementation overload, before `return fetch*()`                                                                                                                    |
| 5   | Developer can run publint on all 4 packages and see zero errors                                          | ✓ VERIFIED | `pnpm validate:publint` ran live — all 4 packages report "All good!" with zero errors                                                                                                                                                                                                                                  |
| 6   | Developer can run arethetypeswrong on all 4 packages and see zero errors                                 | ✓ VERIFIED | `pnpm validate:attw` ran live — all 4 packages show 🟢 across all resolution modes (node10, node16 CJS/ESM, bundler). @lsp-indexer/next's `./server` entry also passes                                                                                                                                                 |
| 7   | Developer can import from @lsp-indexer/node in a server context without client code leaking              | ✓ VERIFIED | `head -1 packages/node/dist/index.js` shows no `"use client"` banner; `packages/next/dist/index.js` has `"use client"` (client entry); `packages/next/dist/server.js` has no `"use client"` (server entry). Clean separation confirmed                                                                                 |
| 8   | Developer can npm pack each package and see only dist/ and package metadata included                     | ✓ VERIFIED | `npm pack --dry-run` for all 4 packages shows only `dist/` files (.js, .cjs, .d.ts, .d.cts, .js.map, .cjs.map) and package.json. No source files, config files, or test fixtures leaked. All packages have `"files": ["dist"]`                                                                                         |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact                                    | Expected                                                    | Status     | Details                                                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types/src/errors.ts`              | VALIDATION category and VALIDATION_FAILED code              | ✓ VERIFIED | `'VALIDATION'` in IndexerErrorCategory (L11), `'VALIDATION_FAILED'` in IndexerErrorCode (L43), `validationErrors` field in IndexerErrorOptions (L59-60) |
| `packages/next/src/actions/validate.ts`     | Shared validateInput utility for all actions                | ✓ VERIFIED | 23-line file exports `validateInput<T>` using Zod safeParse, throws IndexerError.fromValidationError on failure                                         |
| `packages/node/src/errors/indexer-error.ts` | IndexerError with validationErrors field and factory method | ✓ VERIFIED | `validationErrors` readonly field (L36), assigned in constructor (L47), included in toJSON (L63), `fromValidationError` static factory (L211-228)       |
| `package.json`                              | Workspace-level publish validation scripts                  | ✓ VERIFIED | `validate:publint`, `validate:attw`, `validate:publish` scripts present (L26-28); `publint` and `@arethetypeswrong/cli` in devDependencies              |
| `packages/types/package.json`               | Types package with validated exports map                    | ✓ VERIFIED | Proper exports map with `import`/`require` conditions, `types` before `default`, `"files": ["dist"]`                                                    |
| `packages/node/package.json`                | Node package with validated exports map                     | ✓ VERIFIED | Same pattern, publint + attw pass                                                                                                                       |
| `packages/react/package.json`               | React package with validated exports map                    | ✓ VERIFIED | Same pattern, publint + attw pass                                                                                                                       |
| `packages/next/package.json`                | Next package with validated exports map + typesVersions     | ✓ VERIFIED | Dual entry points (`.` and `./server`), `typesVersions` for node10 resolution, `zod` dependency, publint + attw pass                                    |

### Key Link Verification

| From                                        | To                                          | Via                        | Status  | Details                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------- | -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/next/src/actions/*.ts` (12 files) | `packages/next/src/actions/validate.ts`     | `import { validateInput }` | ✓ WIRED | All 12 action files import validateInput from `./validate`                                                                                       |
| `packages/next/src/actions/validate.ts`     | `packages/node/src/errors/indexer-error.ts` | `import { IndexerError }`  | ✓ WIRED | validate.ts imports IndexerError from `@lsp-indexer/node` (L1), calls `IndexerError.fromValidationError()` (L20)                                 |
| `packages/next/src/actions/*.ts`            | `@lsp-indexer/types`                        | `import Use*ParamsSchema`  | ✓ WIRED | All 12 action files import matching `Use*ParamsSchema` from `@lsp-indexer/types` — 21 distinct schemas used in validateInput calls               |
| `package.json scripts`                      | `publint + @arethetypeswrong/cli`           | `devDependencies`          | ✓ WIRED | Both tools installed as workspace devDependencies, scripts reference them via `pnpm --filter ... exec`                                           |
| `packages/*/package.json exports`           | `packages/*/dist/*`                         | `exports map conditions`   | ✓ WIRED | All exports point to `dist/index.*` files; builds produce all required files (.js, .cjs, .d.ts, .d.cts)                                          |
| `@lsp-indexer/next`                         | `@lsp-indexer/node`                         | `server-only dependency`   | ✓ WIRED | @lsp-indexer/node has no `"use client"` banner; @lsp-indexer/next/server has no `"use client"` banner; action files use `'use server'` directive |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                           | Status      | Evidence                                                                                                                                                                                                                                                                                               |
| ----------- | ----------- | ------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ACTION-01   | 11-01       | Developer can use `@lsp-indexer/next` server actions for all 11 domains               | ✓ SATISFIED | 12 action files with 21 server action functions across all 11 domains (profiles, digital-assets, nfts, owned-assets, owned-tokens, followers, creators, issued-assets, encrypted-assets, data-changed-events, token-id-data-changed-events, universal-receiver-events), all exported from barrel index |
| ACTION-02   | 11-02       | Developer can import from `@lsp-indexer/node` (server) without client code leaking    | ✓ SATISFIED | @lsp-indexer/node dist has no "use client" banner; @lsp-indexer/next/server entry has no "use client"; action files marked `'use server'`; full build chain succeeds                                                                                                                                   |
| ACTION-03   | 11-01       | All server action inputs are validated with Zod schemas from `@lsp-indexer/types`     | ✓ SATISFIED | 21 validateInput calls using Use\*ParamsSchema from @lsp-indexer/types; IndexerError thrown with VALIDATION category on invalid input                                                                                                                                                                  |
| DX-03       | 11-02       | All 4 packages pass `publint` and `arethetypeswrong` validation for publish readiness | ✓ SATISFIED | Live validation: publint "All good!" × 4; attw all 🟢 across node10/node16/bundler for all packages including @lsp-indexer/next dual entry points                                                                                                                                                      |

### Anti-Patterns Found

| File | Line | Pattern    | Severity | Impact                                                                                              |
| ---- | ---- | ---------- | -------- | --------------------------------------------------------------------------------------------------- |
| —    | —    | None found | —        | No TODO/FIXME/placeholder comments, no empty implementations, no stub returns in any phase 11 files |

### Human Verification Required

### 1. Server Action End-to-End Behavior

**Test:** Call `getProfile({ address: 'invalid' })` from a Next.js Server Component and observe the error response
**Expected:** IndexerError with `category: 'VALIDATION'`, `code: 'VALIDATION_FAILED'`, and `validationErrors` array containing field-level details
**Why human:** Requires running Next.js app with actual Zod schema validation; grep can verify wiring but not runtime behavior

### 2. Client/Server Bundle Separation in Next.js Build

**Test:** Run `next build` in a consuming Next.js app and check for zero "client-only code in server" or "server-only code in client" warnings
**Expected:** Clean build with no bundle contamination warnings
**Why human:** Requires actual Next.js build environment with the app wired to these packages

### Gaps Summary

No gaps found. All 8 observable truths verified, all artifacts substantive and wired, all 4 requirements satisfied, zero anti-patterns detected. Build chain, publint, and attw all pass with zero errors.

---

_Verified: 2026-03-05T15:10:00Z_
_Verifier: Claude (gsd-verifier)_
