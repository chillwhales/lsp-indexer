# M006: 

## Vision
Fix the production crash in the indexer's VERIFY step where viem's hexToBool() throws InvalidHexBooleanError on non-boolean hex from supportsInterface. Replace all 3 call sites with a safe helper that treats invalid hex as false. Unblock the indexer from its restart loop at block 7,137,664.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Defensive hexToBool hardening | low | — | ✅ | After this: pnpm --filter=@chillwhales/indexer build passes. All 3 hexToBool call sites use safeHexToBool. rg hexToBool shows only the safe wrapper definition and its usages. |
