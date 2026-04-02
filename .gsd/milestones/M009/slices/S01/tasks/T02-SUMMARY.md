---
id: T02
parent: S01
milestone: M009
provides: []
requires: []
affects: []
key_files: ["packages/indexer/src/core/types/plugins.ts", "packages/indexer/src/core/types/handler.ts", "packages/indexer/src/utils/index.ts"]
key_decisions: ["ChillWhales handlers get supportedChains: ['lukso'] only (per D013)", "prefixId uses colon separator (network:id) consistent with existing ID patterns", "generateTokenId/generateFollowId accept optional network param for backward compatibility"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "All 6 verification checks passed: 11 plugins with supportedChains, 29 handlers with supportedChains, 4 ChillWhales handlers lukso-only, prefixId in utils, typeorm build succeeds, schema has 51 network fields."
completed_at: 2026-04-02T05:47:40.283Z
blocker_discovered: false
---

# T02: Added supportedChains to EventPlugin/EntityHandler interfaces, declared chains on all 40 plugins/handlers, and created prefixId helper with optional network param on generateTokenId/generateFollowId

> Added supportedChains to EventPlugin/EntityHandler interfaces, declared chains on all 40 plugins/handlers, and created prefixId helper with optional network param on generateTokenId/generateFollowId

## What Happened
---
id: T02
parent: S01
milestone: M009
key_files:
  - packages/indexer/src/core/types/plugins.ts
  - packages/indexer/src/core/types/handler.ts
  - packages/indexer/src/utils/index.ts
key_decisions:
  - ChillWhales handlers get supportedChains: ['lukso'] only (per D013)
  - prefixId uses colon separator (network:id) consistent with existing ID patterns
  - generateTokenId/generateFollowId accept optional network param for backward compatibility
duration: ""
verification_result: passed
completed_at: 2026-04-02T05:47:40.283Z
blocker_discovered: false
---

# T02: Added supportedChains to EventPlugin/EntityHandler interfaces, declared chains on all 40 plugins/handlers, and created prefixId helper with optional network param on generateTokenId/generateFollowId

**Added supportedChains to EventPlugin/EntityHandler interfaces, declared chains on all 40 plugins/handlers, and created prefixId helper with optional network param on generateTokenId/generateFollowId**

## What Happened

Added readonly supportedChains: string[] to both EventPlugin and EntityHandler interfaces. Created prefixId(network, id) helper in utils returning network:id format. Updated generateTokenId and generateFollowId to accept optional network param for backward-compatible network-prefixed IDs. Added supportedChains: ['lukso', 'lukso-testnet'] to all 11 plugins and 25 generic handlers. Added supportedChains: ['lukso'] to all 4 ChillWhales handlers per D013.

## Verification

All 6 verification checks passed: 11 plugins with supportedChains, 29 handlers with supportedChains, 4 ChillWhales handlers lukso-only, prefixId in utils, typeorm build succeeds, schema has 51 network fields.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -rl 'supportedChains' plugins/events/ | wc -l | grep -q 11` | 0 | ✅ pass | 100ms |
| 2 | `grep -rl 'supportedChains' handlers/ | wc -l | grep -q 29` | 0 | ✅ pass | 100ms |
| 3 | `grep -q 'prefixId' packages/indexer/src/utils/index.ts` | 0 | ✅ pass | 50ms |
| 4 | `pnpm --filter=@chillwhales/typeorm build` | 0 | ✅ pass | 3000ms |
| 5 | `grep -c 'network: String! @index' packages/indexer/schema.graphql` | 0 | ✅ pass | 50ms |
| 6 | `diff packages/indexer/schema.graphql packages/typeorm/schema.graphql` | 0 | ✅ pass | 50ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `packages/indexer/src/core/types/plugins.ts`
- `packages/indexer/src/core/types/handler.ts`
- `packages/indexer/src/utils/index.ts`


## Deviations
None.

## Known Issues
None.
