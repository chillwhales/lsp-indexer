# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

(none)

## Validated

### R015 — Safe `supportsInterface` return parsing
- Class: failure-visibility
- Status: validated
- Description: The VERIFY step's `multicallVerify` must handle non-boolean hex values from `supportsInterface` without crashing. Any return data that is not a valid ABI-encoded boolean (`0x...0001` or `0x...0000`) must be treated as `false` (interface not supported).
- Why it matters: A rogue contract returning garbage hex crashes the indexer into an infinite restart loop (issue #357). The indexer must be resilient to malformed on-chain data.
- Source: user
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: safeHexToBool wraps hexToBool in try-catch returning false on error. pnpm --filter=@chillwhales/indexer build passes. The crash-inducing code path in verification.ts now returns false instead of throwing InvalidHexBooleanError.
- Notes: Crash at block 7,137,664. All 3 call sites migrated (verification.ts, orbsClaimed.handler.ts, chillClaimed.handler.ts).

### R016 — All `hexToBool` call sites hardened
- Class: quality-attribute
- Status: validated
- Description: Every call site in the indexer that uses viem's `hexToBool()` — `verification.ts`, `orbsClaimed.handler.ts`, `chillClaimed.handler.ts` — must use the safe helper instead.
- Why it matters: The same crash pattern exists in multiple locations. Fixing only the reported one leaves time bombs.
- Source: inferred
- Primary owning slice: M006/S01
- Supporting slices: none
- Validation: rg hexToBool packages/indexer/src/ shows only 3 matches, all inside the safe wrapper in utils/index.ts. Zero raw hexToBool calls remain in handlers or core files. All 3 call sites migrated.
- Notes: All 3 call sites (verification.ts, orbsClaimed.handler.ts, chillClaimed.handler.ts) migrated to safeHexToBool.

### R001 — Given two addresses A and B, return the set of profiles that both A and B follow. Computed server-side via Hasura nested `followedBy` relationship filters.
- Class: core-capability
- Status: validated
- Description: Given two addresses A and B, return the set of profiles that both A and B follow. Computed server-side via Hasura nested `followedBy` relationship filters.
- Why it matters: Core social graph feature — "what do we have in common?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: service function + hooks compile. S02: playground page exercises useMutualFollows with include/sort controls, docs list fetchMutualFollows. Full 5-package build exits 0.
- Notes: S01 delivered compile-time contract. Service function uses _and where-clause with dual followedBy filters.

### R002 — Given two addresses A and B, return profiles that follow both A and B. Computed server-side via Hasura nested `followed` relationship filters.
- Class: core-capability
- Status: validated
- Description: Given two addresses A and B, return profiles that follow both A and B. Computed server-side via Hasura nested `followed` relationship filters.
- Why it matters: Core social graph feature — "who follows both of us?"
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: service function + hooks compile. S02: playground page exercises useMutualFollowers with include/sort controls, docs list fetchMutualFollowers. Full 5-package build exits 0.
- Notes: S01 delivered compile-time contract. Service function uses _and where-clause with dual followed filters.

### R003 — Given user's address and a target profile, return profiles from user's following list that also follow the target. "People you follow who also follow this profile."
- Class: core-capability
- Status: validated
- Description: Given user's address and a target profile, return profiles from user's following list that also follow the target. "People you follow who also follow this profile."
- Why it matters: Social proof — shows familiar faces in a profile's follower list
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: service function + hooks compile. S02: playground page exercises useFollowedByMyFollows with myAddress/targetAddress inputs, docs list fetchFollowedByMyFollows. Full 5-package build exits 0.
- Notes: S01 delivered compile-time contract. Uses myAddress + targetAddress params (plan said single address — corrected).

### R004 — React hooks calling Hasura directly via `getClientUrl()` for all three mutual follow queries
- Class: core-capability
- Status: validated
- Description: React hooks calling Hasura directly via `getClientUrl()` for all three mutual follow queries
- Why it matters: Consumer packages must expose the hooks for direct browser usage
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: S01: 6 React hooks exported. S02: playground page imports all 6 React hooks with HookMode toggle, docs list all 6 in domain table. Full build exits 0.
- Notes: S01 delivered 6 React hooks calling Hasura directly via getClientUrl().

### R005 — Next.js hooks routing through server actions + server action exports for all three mutual follow queries
- Class: core-capability
- Status: validated
- Description: Next.js hooks routing through server actions + server action exports for all three mutual follow queries
- Why it matters: Consumer packages must expose hooks for Next.js apps keeping endpoint hidden
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: pnpm --filter=@lsp-indexer/next build exits 0. 3 server actions with 'use server' directive + Zod validation in packages/next/src/actions/followers.ts. 6 Next.js hooks exported from packages/next/src/hooks/followers/index.ts. Playground page exercises all hooks.
- Notes: S01 delivered 3 server actions + 6 Next.js client hooks routing through server actions.

### R006 — Returned profiles support the existing ProfileInclude type narrowing — consumers can opt into specific profile fields
- Class: quality-attribute
- Status: validated
- Description: Returned profiles support the existing ProfileInclude type narrowing — consumers can opt into specific profile fields
- Why it matters: Consistency with existing hook API patterns (DX-04)
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: All service functions and factories use `<const I extends ProfileInclude>` with 3-overload signatures. TypeScript compilation across all 4 packages validates type narrowing works correctly.
- Notes: S01 delivered 3-overload ProfileInclude narrowing on all hooks and server actions.

### R007 — `useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows` with offset-based pagination
- Class: core-capability
- Status: validated
- Description: `useInfiniteMutualFollows`, `useInfiniteMutualFollowers`, `useInfiniteFollowedByMyFollows` with offset-based pagination
- Why it matters: Social lists can be long — infinite scroll is table stakes
- Source: inferred
- Primary owning slice: M004/S01
- Supporting slices: none
- Validation: useInfiniteMutualFollows, useInfiniteMutualFollowers, useInfiniteFollowedByMyFollows all present in react and next packages with offset-based pagination via createUseInfinite factory. Build passes. Playground page includes infinite scroll tabs.
- Notes: S01 delivered 3 infinite scroll variants with offset-based pagination via createUseInfinite factories.

### R008 — types, node, react, next all compile with zero errors after changes
- Class: quality-attribute
- Status: validated
- Description: types, node, react, next all compile with zero errors after changes
- Why it matters: Publish readiness
- Source: inferred
- Primary owning slice: M004/S02
- Supporting slices: none
- Validation: All 5 packages (types, node, react, next, docs) build with zero errors. Verified by pnpm build across all filters.
- Notes: S02 validated — full build chain exits 0 including docs app with MDX pages and playground page.

### R009 — Service function accepts an array of `{ address, contentId, revision }` tuples and queries Hasura using `_or`/`_and` where-clauses.
- Class: core-capability
- Status: validated
- Description: Service function accepts an array of `{ address, contentId, revision }` tuples and queries Hasura using `_or`/`_and` where-clauses. Address comparison uses `_ilike` (checksummed ≡ non-checksummed). contentId uses `_eq`, revision uses `_eq`.
- Why it matters: Bookmarks reference encrypted assets by unique tuple — no way to batch-fetch them with the current single-filter API without N round trips.
- Source: user
- Primary owning slice: M005/S01
- Supporting slices: none
- Validation: fetchEncryptedAssetsBatch builds _or/_and where-clauses with _ilike for address, _eq for contentId/revision. pnpm --filter=@lsp-indexer/node build exits 0. Docs document the function in node, react, and next pages.
- Notes: Follows `fetchIsFollowingBatch` pattern with `_or`/`_and` clauses.

### R010 — Batch results support the same 3-overload `<const I extends EncryptedAssetInclude>` pattern as `fetchEncryptedAssets`
- Class: quality-attribute
- Status: validated
- Description: Batch results support the same 3-overload `<const I extends EncryptedAssetInclude>` pattern as `fetchEncryptedAssets`, so consumers get precise type narrowing on included fields.
- Why it matters: Consistency with existing API — batch shouldn't be a second-class citizen.
- Source: inferred
- Primary owning slice: M005/S01
- Supporting slices: none
- Validation: fetchEncryptedAssetsBatch, createUseEncryptedAssetsBatch, and getEncryptedAssetsBatch all use 3-overload <const I extends EncryptedAssetInclude> pattern. All 4 consumer packages build with zero errors.
- Notes: Same overload pattern as fetchEncryptedAssets.

### R011 — React hook via factory pattern calling Hasura directly. Next.js hook routing through a server action with Zod validation.
- Class: core-capability
- Status: validated
- Description: React hook via factory pattern calling Hasura directly. Next.js hook routing through a server action with Zod validation. Both support EncryptedAssetInclude narrowing.
- Why it matters: Consumers need hooks, not just a service function.
- Source: inferred
- Primary owning slice: M005/S01
- Supporting slices: none
- Validation: useEncryptedAssetsBatch React hook via createUseEncryptedAssetsBatch factory + useEncryptedAssetsBatch Next.js hook via getEncryptedAssetsBatch server action with Zod validation. Both support EncryptedAssetInclude narrowing. pnpm build exits 0 for react and next. Docs document hooks in react and next pages.
- Notes: No infinite scroll variant — batch is for a known finite set of tuples.

### R012 — Encrypted assets docs page documents batch API
- Class: quality-attribute
- Status: validated
- Description: Encrypted assets docs page documents `fetchEncryptedAssetsBatch`, `useEncryptedAssetsBatch`, batch tuple params, and usage examples.
- Why it matters: Outdated docs are worse than no docs.
- Source: inferred
- Primary owning slice: M005/S02
- Supporting slices: none
- Validation: All three docs pages contain batch API documentation: `fetchEncryptedAssetsBatch` in node docs, `useEncryptedAssetsBatch` in react and next docs, `getEncryptedAssetsBatch` in next docs, `EncryptedAssetBatchTuple` in react docs. Verified by grep checks.
- Notes: none

### R013 — Changeset created for minor version bump
- Class: quality-attribute
- Status: validated
- Description: Changeset created for minor version bump. All four packages are in a fixed group — one changeset bumps all together.
- Why it matters: Consumers can install the new batch capability.
- Source: user
- Primary owning slice: M005/S02
- Supporting slices: none
- Validation: `.changeset/add-encrypted-assets-batch.md` exists with all four packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) listed as `minor`.
- Notes: `.changeset/config.json` has fixed group for all four packages.

### R014 — types, node, react, next, and docs all compile with zero errors after all changes
- Class: quality-attribute
- Status: validated
- Description: types, node, react, next, and docs all compile with zero errors after all changes
- Why it matters: Publish readiness.
- Source: inferred
- Primary owning slice: M005/S02
- Supporting slices: M005/S01
- Validation: `pnpm build` exits 0 across all 5 packages (types, node, react, next, docs). Docs build generated all 22 static pages successfully.
- Notes: none

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M004/S01 | none | validated |
| R002 | core-capability | validated | M004/S01 | none | validated |
| R003 | core-capability | validated | M004/S01 | none | validated |
| R004 | core-capability | validated | M004/S01 | none | validated |
| R005 | core-capability | validated | M004/S01 | none | validated |
| R006 | quality-attribute | validated | M004/S01 | none | validated |
| R007 | core-capability | validated | M004/S01 | none | validated |
| R008 | quality-attribute | validated | M004/S02 | none | validated |
| R009 | core-capability | validated | M005/S01 | none | validated |
| R010 | quality-attribute | validated | M005/S01 | none | validated |
| R011 | core-capability | validated | M005/S01 | none | validated |
| R012 | quality-attribute | validated | M005/S02 | none | validated |
| R013 | quality-attribute | validated | M005/S02 | none | validated |
| R014 | quality-attribute | validated | M005/S02 | M005/S01 | validated |
| R015 | failure-visibility | validated | M006/S01 | none | validated |
| R016 | quality-attribute | validated | M006/S01 | none | validated |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 0
- Validated: 16 (R001–R016)
- Unmapped active requirements: 0
