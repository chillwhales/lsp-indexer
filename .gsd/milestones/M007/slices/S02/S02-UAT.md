# S02: NftFilter + OwnedToken propagation — UAT

**Milestone:** M007
**Written:** 2026-03-30T11:09:43.889Z

# S02: NftFilter + OwnedToken propagation — UAT

**Milestone:** M007
**Written:** 2026-03-30

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: Filter fields are type-level additions verified by TypeScript compilation; runtime behavior depends on Hasura schema which is not available in CI

## Preconditions

- All 9 workspace projects build successfully (`pnpm build` exits 0)
- Hasura schema includes `chillClaimed`, `orbsClaimed`, `level`, and `cooldownExpiry` relationships on the NFT entity

## Smoke Test

Run `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build` — both exit 0, confirming the new filter fields and where-clause conditions compile.

## Test Cases

### 1. NftFilterSchema accepts all 4 new fields

1. Import `NftFilterSchema` from `@lsp-indexer/types`
2. Parse `{ chillClaimed: true, orbsClaimed: false, maxLevel: 5, cooldownExpiryBefore: 1700000000 }`
3. **Expected:** Parse succeeds, all 4 fields present in the output object with correct values

### 2. NftFilterSchema accepts false and 0 as valid values

1. Parse `{ chillClaimed: false, maxLevel: 0 }`
2. **Expected:** Parse succeeds — `false` and `0` are not stripped (fields are optional, not nullable-only)

### 3. NftFilterSchema rejects invalid types

1. Parse `{ chillClaimed: "yes" }`
2. **Expected:** Zod validation error — `chillClaimed` expects boolean, not string
3. Parse `{ maxLevel: true }`
4. **Expected:** Zod validation error — `maxLevel` expects number, not boolean

### 4. buildNftWhere produces correct conditions for boolean filters

1. Call `buildNftWhere({ chillClaimed: true })`
2. **Expected:** Returns where-clause containing `{ chillClaimed: { value: { _eq: true } } }`
3. Call `buildNftWhere({ orbsClaimed: false })`
4. **Expected:** Returns where-clause containing `{ orbsClaimed: { value: { _eq: false } } }`

### 5. buildNftWhere produces correct conditions for numeric filters

1. Call `buildNftWhere({ maxLevel: 10 })`
2. **Expected:** Returns where-clause containing `{ level: { value: { _lte: 10 } } }`
3. Call `buildNftWhere({ cooldownExpiryBefore: 1700000000 })`
4. **Expected:** Returns where-clause containing `{ cooldownExpiry: { value: { _lte: 1700000000 } } }`

### 6. buildNftWhere handles maxLevel: 0 correctly

1. Call `buildNftWhere({ maxLevel: 0 })`
2. **Expected:** Returns where-clause containing `{ level: { value: { _lte: 0 } } }` — the `!== undefined` guard must not skip zero

### 7. buildNftWhere omits conditions for undefined filters

1. Call `buildNftWhere({})` (empty filter)
2. **Expected:** No chillClaimed, orbsClaimed, level, or cooldownExpiry conditions in the where-clause

## Edge Cases

### chillClaimed: false is not skipped

1. Call `buildNftWhere({ chillClaimed: false })`
2. **Expected:** Condition `{ chillClaimed: { value: { _eq: false } } }` IS present (not skipped by truthiness check)

### cooldownExpiryBefore: 0 is not skipped

1. Call `buildNftWhere({ cooldownExpiryBefore: 0 })`
2. **Expected:** Condition `{ cooldownExpiry: { value: { _lte: 0 } } }` IS present

## Failure Signals

- `pnpm build` fails in types or node package
- Filter fields missing from NftFilterSchema TypeScript type (import and check in IDE)
- buildNftWhere silently skips `false` or `0` filter values (would indicate truthiness check instead of `!== undefined`)

## Not Proven By This UAT

- Runtime Hasura query execution with these filters (requires live database)
- OwnedToken nested NFT include propagation at runtime (compile-time only)
- Performance impact of additional where-clause conditions on large datasets

## Notes for Tester

The critical edge case is falsy values: `chillClaimed: false` and `maxLevel: 0` must produce where-clause conditions, not be silently skipped. The code uses `!== undefined` guards specifically for this reason.
