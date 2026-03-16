# OrbLevel/OrbCooldownExpiry FK Enrichment Bug

**Date:** 2026-03-16
**PR:** #332
**Trigger:** Unfetched LSP4Metadata after 7+ hours + hundreds of "FK field not found" warnings

## Root Cause

### LSP4Metadata unfetched (not a bug)

Metadata fetching is gated behind `hctx.isHead` (`metadataFetch.ts:243`). During historical sync, `isHead=false` so no metadata is fetched. The DB backlog drain starts automatically once the indexer catches up to chain tip.

### OrbLevel FK enrichment failure (bug — fixed)

TypeORM entities loaded from `store.findOneBy()` don't have relation properties (`digitalAsset`, `nft`) as own enumerable properties. The `OrbLevel` constructor uses `Object.assign(this, props)`, and TypeScript's `!` field declarations generate no runtime code. So:

1. `resolveEntity()` loads entity from DB → instance has column fields only
2. Handler spreads into new constructor: `new OrbLevel({ ...existing, value: 5 })`
3. Spread can't copy `digitalAsset`/`nft` because they don't exist on the source
4. Pipeline's `if (!(request.fkField in entity))` correctly rejects the missing fields
5. FK stays null permanently

**Fix:** Explicitly set FK fields: `digitalAsset: existing?.digitalAsset ?? null`
This creates the property via `Object.assign`, making the `in` check pass.

## Gotcha for Future Reference

Any handler using `resolveEntity()` + spread to create updated entities must explicitly set FK relation fields. Column fields spread fine; relation fields don't. The mint path (LSP8Transfer) was unaffected because it already set `digitalAsset: null, nft: null` explicitly.
