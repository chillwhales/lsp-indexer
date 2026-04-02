# S02: Backfill Migration — Research

**Date:** 2026-04-02
**Status:** Complete
**Depth:** Deep — high-risk migration touching all 71 tables, PK rewrites, FK cascading

## Summary

This slice writes a hand-written SQL migration (per D018) that transforms existing LUKSO data to the multi-chain schema established in S01. The migration must: (1) add `network` column with default `'lukso'` to all tables that don't yet have it in PostgreSQL, (2) prefix deterministic IDs with `lukso:`, and (3) update all FK columns that reference those prefixed IDs. UUID-based entity IDs are NOT prefixed (per D015).

The core risk is FK cascading — a single missed FK column creates orphaned references that silently corrupt data. This research maps every FK relationship exhaustively.

**Key finding:** `LSP12IssuedAsset` entities in S01 code have a bug — their composite IDs (`${address} - ${assetAddress}`) are NOT prefixed with network, unlike every other deterministic entity. The migration script should still prefix them (to match the intended pattern), and the handler code should be fixed as a follow-up or within this slice.

## Recommendation

**Three-task structure:**
1. **T01: Write the SQL migration script** — The core deliverable. Hand-written SQL in a single file (`db/migrations/backfill-network.sql` or placed in `packages/typeorm/db/migrations/`). Must be idempotent (safe to re-run). Uses a single transaction for atomicity.
2. **T02: Update entrypoint.sh** — The entrypoint still references `packages/typeorm` for migrations (stale after M008). Update to run the backfill migration from the correct location.
3. **T03: Verification** — Run the migration against a test schema, verify row counts, FK integrity, and ID formats.

**Migration strategy:** Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso'` for the network column (S01 already added it to the TypeORM model, but existing PostgreSQL databases from production won't have it). Then use `UPDATE ... SET id = 'lukso:' || id` for deterministic PKs, and corresponding FK updates.

**Critical ordering:** FK constraints must be deferred or temporarily dropped during PK/FK updates. PostgreSQL supports `SET CONSTRAINTS ALL DEFERRED` within a transaction if constraints are declared `DEFERRABLE`. If not deferrable, the migration must temporarily drop FK constraints, do the updates, and re-add them.

## Implementation Landscape

### Key Files

- `packages/typeorm/db/migrations/` — Target directory for migration files (doesn't exist yet, created by `squid-typeorm-migration generate`)
- `packages/typeorm/package.json` — Has `migration:generate` and `migration:apply` scripts
- `docker/entrypoint.sh` — Runs `pnpm migration:generate` and `pnpm migration:apply` from `packages/typeorm`; needs updating for the hand-written migration
- `packages/indexer/schema.graphql` — Already has `network: String! @index` on all 71 entities (from S01)
- `packages/indexer/src/model/generated/` — Already has `network` field on all entity classes (from S01)

### Database Naming Convention

Subsquid uses `@subsquid/typeorm-config` which configures TypeORM with `SnakeNamingStrategy`:
- **Table names:** PascalCase entity → snake_case table (e.g., `UniversalProfile` → `universal_profile`)
- **Column names:** camelCase property → snake_case column (e.g., `blockNumber` → `block_number`)
- **FK columns:** `joinColumnName(relationName, referencedColumnName)` → `toSnakeCase("{relation}_id")` (e.g., `digitalAsset` → `digital_asset_id`, `fromProfile` → `from_profile_id`)

### Entity Classification

**71 total entities. 27 use deterministic IDs (need `lukso:` prefix). 44 use UUID IDs (no prefix needed).**

#### Deterministic ID Entities (PK prefix required)

| Entity | ID Pattern | FK Target? | # Referencing FK Columns |
|--------|-----------|------------|--------------------------|
| UniversalProfile | `prefixId(net, address)` | Yes | 35 FK columns across 24 tables |
| DigitalAsset | `prefixId(net, address)` | Yes | 28 FK columns across 26 tables |
| NFT | `generateTokenId(net, addr, tokenId)` | Yes | 9 FK columns across 8 tables |
| LSP4Metadata | `prefixId(net, address)` | Yes | 13 FK columns across 11 tables |
| LSP3Profile | `prefixId(net, address)` | Yes | 8 FK columns across 8 tables |
| LSP6Controller | `prefixId(net, "addr - addr")` | Yes | 3 FK columns across 3 tables |
| LSP29EncryptedAsset | `prefixId(net, address)` or composite | Yes | 6 FK columns across 6 tables |
| OwnedAsset | `generateOwnedAssetId(net, ...)` | Yes | 1 FK column |
| TotalSupply | `prefixId(net, address)` | No | 0 |
| Decimals | `prefixId(net, address)` | No | 0 |
| DigitalAssetOwner | `prefixId(net, address)` | No | 0 |
| UniversalProfileOwner | `prefixId(net, address)` | No | 0 |
| LSP4TokenName | `prefixId(net, address)` | No | 0 |
| LSP4TokenSymbol | `prefixId(net, address)` | No | 0 |
| LSP4TokenType | `prefixId(net, address)` | No | 0 |
| LSP4CreatorsLength | `prefixId(net, address)` | No | 0 |
| LSP3ProfileName | `prefixId(net, address)` | No | 0 |
| LSP5ReceivedAssetsLength | `prefixId(net, address)` | No | 0 |
| LSP6ControllersLength | `prefixId(net, address)` | No | 0 |
| LSP8TokenIdFormat | `prefixId(net, address)` | No | 0 |
| LSP8ReferenceContract | `prefixId(net, address)` | No | 0 |
| LSP8TokenMetadataBaseURI | `prefixId(net, "BaseURI - ...")` | No | 0 |
| LSP12IssuedAssetsLength | `prefixId(net, address)` | No | 0 |
| LSP29EncryptedAssetEntry | `prefixId(net, "addr - dataKey")` | No | 0 |
| LSP29EncryptedAssetsLength | `prefixId(net, address)` | No | 0 |
| OwnedToken | `generateOwnedTokenId(net, ...)` | No | 0 |
| Follower | `generateFollowId(net, ...)` | No | 0 |

#### Deterministic Composite ID Entities (inherit prefix from parent)

These entities have IDs built from an already-prefixed parent ID:

| Entity | ID Pattern | Notes |
|--------|-----------|-------|
| LSP6Permission | `"${controllerId} - ${permName}"` | controllerId already prefixed |
| LSP6AllowedCall | `"${controllerId} - ${i}"` | controllerId already prefixed |
| LSP6AllowedERC725YDataKey | `"${controllerId} - ${i}"` | controllerId already prefixed |
| LSP5ReceivedAsset | `prefixId(net, "addr - assetAddr")` | directly prefixed |
| LSP4Creator | `prefixId(net, "addr - creatorAddr")` | directly prefixed |
| LSP12IssuedAsset | `"${address} - ${assetAddress}"` | ⚠️ BUG: NOT prefixed in handler code |

#### UUID ID Entities (NO prefix, only need network column)

All 11 event plugin entities (DataChanged, Executed, Transfer, Follow, Unfollow, OwnershipTransferred, UniversalReceiver, DeployedContracts, DeployedERC1167Proxies, TokenIdDataChanged, ChillClaimed, OrbsClaimed) plus metadata sub-entities (LSP3ProfileDescription, LSP3ProfileImage, LSP3ProfileAsset, LSP3ProfileLink, LSP3ProfileTag, LSP3ProfileBackgroundImage, LSP4MetadataName, LSP4MetadataDescription, LSP4MetadataImage, LSP4MetadataIcon, LSP4MetadataLink, LSP4MetadataAsset, LSP4MetadataAttribute, LSP4MetadataScore, LSP4MetadataRank, LSP4MetadataCategory, LSP29EncryptedAssetTitle, LSP29EncryptedAssetDescription, LSP29EncryptedAssetFile, LSP29EncryptedAssetImage, LSP29EncryptedAssetEncryption, LSP29EncryptedAssetChunks, LSP29EncryptedAssetRevisionCount, OrbLevel, OrbFaction, OrbCooldownExpiry).

### Complete FK Update Map

Every FK column that references a deterministic-ID entity must be updated to add the `lukso:` prefix.

**Referenced by UniversalProfile (35 FK columns):**

| Table (snake_case) | FK Column | 
|-----|-----------|
| data_changed | universal_profile_id |
| deployed_contracts | universal_profile_id |
| deployed_erc1167_proxies | universal_profile_id |
| executed | target_profile_id |
| executed | universal_profile_id |
| follow | followed_universal_profile_id |
| follow | follower_universal_profile_id |
| follower | followed_universal_profile_id |
| follower | follower_universal_profile_id |
| lsp12_issued_asset | universal_profile_id |
| lsp12_issued_assets_length | universal_profile_id |
| lsp29_encrypted_asset | universal_profile_id |
| lsp29_encrypted_asset_entry | universal_profile_id |
| lsp29_encrypted_asset_revision_count | universal_profile_id |
| lsp29_encrypted_assets_length | universal_profile_id |
| lsp3_profile | universal_profile_id |
| lsp4_creator | creator_profile_id |
| lsp5_received_asset | universal_profile_id |
| lsp5_received_assets_length | universal_profile_id |
| lsp6_controller | controller_profile_id |
| lsp6_controller | universal_profile_id |
| lsp6_controllers_length | universal_profile_id |
| owned_asset | universal_profile_id |
| owned_token | universal_profile_id |
| ownership_transferred | new_owner_profile_id |
| ownership_transferred | previous_owner_profile_id |
| ownership_transferred | universal_profile_id |
| transfer | from_profile_id |
| transfer | operator_profile_id |
| transfer | to_profile_id |
| unfollow | follower_universal_profile_id |
| unfollow | unfollowed_universal_profile_id |
| universal_profile_owner | universal_profile_id |
| universal_receiver | from_profile_id |
| universal_receiver | universal_profile_id |

**Referenced by DigitalAsset (28 FK columns):**

| Table | FK Column |
|-------|-----------|
| chill_claimed | digital_asset_id |
| data_changed | digital_asset_id |
| decimals | digital_asset_id |
| digital_asset_owner | digital_asset_id |
| executed | target_asset_id |
| lsp12_issued_asset | issued_asset_id |
| lsp4_creator | digital_asset_id |
| lsp4_creators_length | digital_asset_id |
| lsp4_metadata | digital_asset_id |
| lsp4_token_name | digital_asset_id |
| lsp4_token_symbol | digital_asset_id |
| lsp4_token_type | digital_asset_id |
| lsp5_received_asset | received_asset_id |
| lsp8_reference_contract | digital_asset_id |
| lsp8_token_id_format | digital_asset_id |
| lsp8_token_metadata_base_uri | digital_asset_id |
| nft | digital_asset_id |
| orb_cooldown_expiry | digital_asset_id |
| orb_faction | digital_asset_id |
| orb_level | digital_asset_id |
| orbs_claimed | digital_asset_id |
| owned_asset | digital_asset_id |
| owned_token | digital_asset_id |
| ownership_transferred | digital_asset_id |
| token_id_data_changed | digital_asset_id |
| total_supply | digital_asset_id |
| transfer | digital_asset_id |
| universal_receiver | from_asset_id |

**Referenced by NFT (9 FK columns):**

| Table | FK Column |
|-------|-----------|
| chill_claimed | nft_id |
| lsp4_metadata | nft_id |
| orb_cooldown_expiry | nft_id |
| orb_faction | nft_id |
| orb_level | nft_id |
| orbs_claimed | nft_id |
| owned_token | nft_id |
| token_id_data_changed | nft_id |
| transfer | nft_id |

**Referenced by LSP4Metadata (13 FK columns):**

| Table | FK Column |
|-------|-----------|
| digital_asset | lsp4_metadata_id |
| lsp4_metadata_asset | lsp4_metadata_id |
| lsp4_metadata_attribute | lsp4_metadata_id |
| lsp4_metadata_category | lsp4_metadata_id |
| lsp4_metadata_description | lsp4_metadata_id |
| lsp4_metadata_icon | lsp4_metadata_id |
| lsp4_metadata_image | lsp4_metadata_id |
| lsp4_metadata_link | lsp4_metadata_id |
| lsp4_metadata_name | lsp4_metadata_id |
| lsp4_metadata_rank | lsp4_metadata_id |
| lsp4_metadata_score | lsp4_metadata_id |
| nft | lsp4_metadata_id |
| nft | lsp4_metadata_base_uri_id |

**Referenced by LSP3Profile (8 FK columns):**

| Table | FK Column |
|-------|-----------|
| lsp3_profile_asset | lsp3_profile_id |
| lsp3_profile_background_image | lsp3_profile_id |
| lsp3_profile_description | lsp3_profile_id |
| lsp3_profile_image | lsp3_profile_id |
| lsp3_profile_link | lsp3_profile_id |
| lsp3_profile_name | lsp3_profile_id |
| lsp3_profile_tag | lsp3_profile_id |
| universal_profile | lsp3_profile_id |

**Referenced by LSP6Controller (3 FK columns):**

| Table | FK Column |
|-------|-----------|
| lsp6_allowed_call | controller_id |
| lsp6_allowed_erc725y_data_key | controller_id |
| lsp6_permission | controller_id |

**Referenced by LSP29EncryptedAsset (6 FK columns):**

| Table | FK Column |
|-------|-----------|
| lsp29_encrypted_asset_chunks | lsp29_encrypted_asset_id |
| lsp29_encrypted_asset_description | lsp29_encrypted_asset_id |
| lsp29_encrypted_asset_encryption | lsp29_encrypted_asset_id |
| lsp29_encrypted_asset_file | lsp29_encrypted_asset_id |
| lsp29_encrypted_asset_image | lsp29_encrypted_asset_id |
| lsp29_encrypted_asset_title | lsp29_encrypted_asset_id |

**Referenced by OwnedAsset (1 FK column):**

| Table | FK Column |
|-------|-----------|
| owned_token | owned_asset_id |

### Migration Script Structure

```sql
BEGIN;

-- 1. Add network column to all tables (idempotent)
ALTER TABLE universal_profile ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
-- ... repeat for all 71 tables ...

-- 2. Temporarily drop FK constraints (or use DEFERRABLE)
-- Must list every FK constraint name

-- 3. Prefix deterministic PKs
UPDATE universal_profile SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE digital_asset SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE nft SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
-- ... all 27+ deterministic entities ...

-- 4. Update all FK columns referencing those PKs
UPDATE data_changed SET universal_profile_id = 'lukso:' || universal_profile_id 
  WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
-- ... all ~100+ FK columns ...

-- 5. Re-add FK constraints

-- 6. Add indexes on network column (if not already present)

COMMIT;
```

### Constraint Handling Strategy

PostgreSQL FK constraints are NOT DEFERRABLE by default. Options:
1. **Drop and re-create constraints** — Safest, most verbose. Need to extract constraint names from `information_schema.table_constraints`.
2. **ALTER CONSTRAINT SET DEFERRABLE** — Requires superuser on some versions; not always available.
3. **Update FK columns first, then PKs** — Won't work because FK checks happen immediately.
4. **Disable triggers** — `ALTER TABLE ... DISABLE TRIGGER ALL` disables FK checks. Re-enable after. Requires table owner privileges (not superuser). **This is the recommended approach.**

**Recommended:** Use `ALTER TABLE ... DISABLE TRIGGER ALL` on each table, do all updates, then `ALTER TABLE ... ENABLE TRIGGER ALL`. This is simpler than dropping/recreating constraints and handles all constraint types.

### entrypoint.sh Status

Current `docker/entrypoint.sh`:
- Line 6: `cd /app/packages/typeorm` — stale after M008 if schema is now in `packages/indexer`
- Runs `pnpm migration:generate` then `pnpm migration:apply`
- The hand-written migration needs to be placed where `squid-typeorm-migration apply` can find it

`squid-typeorm-migration apply` looks for migrations in `db/migrations/` relative to the project root. Since entrypoint runs from `packages/typeorm`, migrations should go in `packages/typeorm/db/migrations/`.

However, post-M008, the schema.graphql is in `packages/indexer/`. The entrypoint may need to be updated to:
1. Run schema codegen + auto-migration from `packages/indexer` (or `packages/typeorm` if it still has the schema)
2. Run the hand-written backfill migration separately

## Constraints

- **Single transaction** — The entire migration must run atomically. A partial migration leaves the DB in an inconsistent state.
- **Idempotent** — The migration must be safe to re-run. Use `WHERE id NOT LIKE 'lukso:%'` guards on all UPDATE statements and `ADD COLUMN IF NOT EXISTS` for the network column.
- **No data loss** — Row counts before and after must match for every table.
- **FK integrity** — After migration, all FK references must point to valid PKs. Verify with `SELECT count(*) FROM child WHERE fk_col IS NOT NULL AND fk_col NOT IN (SELECT id FROM parent)`.

## Common Pitfalls

- **Missing FK column** — The migration has ~103 FK columns to update. Missing one creates silent data corruption. The FK map above must be validated against the actual PostgreSQL schema.
- **Composite IDs with spaces** — IDs like `"0xabc - 0xdef"` contain spaces. The `lukso:` prefix goes at the start: `"lukso:0xabc - 0xdef"`. The prefix logic is: `'lukso:' || id`.
- **LSP6Permission/AllowedCall/AllowedERC725YDataKey** — These have IDs like `"lukso:0xaddr - 0xaddr - permName"`. In production, the first part (controller ID) is NOT yet prefixed. The migration must prefix the entire ID: `'lukso:' || id`.
- **LSP12IssuedAsset handler bug** — The handler code at `lsp12IssuedAssets.handler.ts:179,264` creates IDs without `prefixId()`. This means newly indexed data will have unprefixed IDs while migrated data will have prefixed IDs. **Must fix the handler code in this slice or flag for immediate follow-up.**
- **Network column already exists in TypeORM model** — S01 added the `network` field to all entities. If a fresh DB is created with the new schema, the `network` column already exists. The migration must use `ADD COLUMN IF NOT EXISTS`.
- **Table names with acronyms** — Subsquid's `SnakeNamingStrategy` converts `LSP3Profile` to `lsp3_profile`, `DeployedERC1167Proxies` to `deployed_erc1167_proxies`, `LSP6AllowedERC725YDataKey` to `lsp6_allowed_erc725_y_data_key`. Double-check these against the actual DB schema.

## Bug Found: LSP12IssuedAsset Missing Network Prefix

**File:** `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts` lines 179, 264
**Issue:** `const id = \`${address} - ${assetAddress}\`` — should be `const id = prefixId(hctx.batchCtx.network, \`${address} - ${assetAddress}\`)`
**Impact:** New LSP12IssuedAsset entities will have unprefixed IDs, breaking consistency with all other deterministic entities. This should be fixed as part of this slice.

## Skill Discovery

No additional skills needed. This is pure SQL migration work + shell script updates. The relevant technologies (PostgreSQL, TypeORM, Subsquid) are already well-understood in the codebase.

## Sources

- Subsquid `@subsquid/typeorm-config` — confirmed `SnakeNamingStrategy` via source inspection at `node_modules/.pnpm/@subsquid+typeorm-config@4.1.1/.../lib/namingStrategy.js`
- Subsquid `@subsquid/typeorm-config` — confirmed `joinColumnName()` produces `toSnakeCase("{relation}_id")` pattern
- D015 — UUID IDs not prefixed
- D018 — Hand-written SQL migration (not auto-generated)
- S01 summary — all 71 entities have network field, prefixId helper established
