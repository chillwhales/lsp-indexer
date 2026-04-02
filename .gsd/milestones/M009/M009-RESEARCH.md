# M009: Multi-chain Indexer Infrastructure — Research

**Date:** 2026-04-02
**Status:** Complete

## Summary

M009 transforms the indexer from a LUKSO-only monolith into a structurally multi-chain system. The work touches every layer: schema (51 entities need a `network` column), ID generation (deterministic IDs need network prefixes), plugin/handler interfaces (`supportedChains` field), processor instantiation (factory instead of singleton), constants (chain config registry instead of hardcoded values), and Docker Compose (per-chain services).

The most dangerous slice is the backfill migration — updating deterministic IDs means updating both primary key columns and every FK that references them across ~30 tables. This must be proven safe on a staging DB before production. The highest-uncertainty risk is that **LUKSO testnet has no SQD gateway** — the SQD public gateway list confirms only `lukso-mainnet` (chain ID 42). The URL `https://v2.archive.subsquid.io/network/lukso-testnet` returns HTTP 404. Testnet proof will require RPC-only mode (no archive gateway), which is slower but functional.

The recommended approach is: (1) chain config registry + types first (unblocks everything), (2) schema + network column + codegen, (3) plugin/handler `supportedChains` + registry filtering, (4) processor factory + entry point parameterization, (5) backfill migration (riskiest — do it late with full schema in place), (6) Docker Compose per-chain services, (7) LUKSO testnet proof.

## Recommendation

**Build types and plumbing first, backfill migration last.** The chain config registry is the foundation — every subsequent slice imports it. Schema changes (adding `network` column) should come early because they trigger codegen and affect every handler/plugin. The backfill migration is the riskiest piece and should be done after all schema changes are finalized, so we only need one migration script. Testnet proof is the capstone.

**For LUKSO testnet without SQD gateway:** Use `EvmBatchProcessor` with only `setRpcEndpoint()` (no `setGateway()`). Subsquid supports RPC-only mode — it's slower for historical sync but works fine for proof-of-concept. The processor factory should make gateway optional.

**For UUID-based event entities:** Do NOT prefix UUIDs with network. UUIDs are globally unique by definition. Only deterministic IDs (address-based, composite) need network prefixing. This simplifies the backfill migration — event entities only need the `network` column, not ID rewrites.

## Implementation Landscape

### Key Files

- `packages/indexer/src/constants/index.ts` — All hardcoded LUKSO constants. Replace with chain config registry. Currently exports: `SQD_GATEWAY`, `RPC_URL`, `RPC_RATE_LIMIT`, `FINALITY_CONFIRMATION`, `IPFS_GATEWAY`, `MULTICALL_ADDRESS`, `LSP26_ADDRESS`, `LSP23_ADDRESS`, `ZERO_ADDRESS`, `DEAD_ADDRESS`, plus fetch tuning constants (FETCH_LIMIT, etc.). Chain-specific: gateway, RPC, multicall, LSP26, LSP23, rate limit, finality. Chain-agnostic: IPFS, fetch limits, zero/dead addresses.
- `packages/indexer/src/constants/chillwhales.ts` — Chillwhales-specific addresses (`CHILLWHALES_ADDRESS`, `CHILL_ADDRESS`, `ORBS_ADDRESS`). LUKSO-only per D013.
- `packages/indexer/src/app/processor.ts` — Singleton `EvmBatchProcessor`. Must become a factory function `createProcessor(chainConfig)`.
- `packages/indexer/src/app/index.ts` — Main entry point. Currently creates one registry + one processor. Must read `CHAIN_ID` from env, look up chain config, create chain-specific processor, and pass network to pipeline.
- `packages/indexer/src/app/bootstrap.ts` — Creates `PluginRegistry`. Needs to accept chain config and filter plugins/handlers by `supportedChains`.
- `packages/indexer/src/app/config.ts` — Creates `PipelineConfig`. May need chain config injected for verification/multicall.
- `packages/indexer/src/core/types/plugins.ts` — `EventPlugin` interface. Add `supportedChains?: string[]` (optional — undefined = all chains).
- `packages/indexer/src/core/types/handler.ts` — `EntityHandler` interface. Add `supportedChains?: string[]`.
- `packages/indexer/src/core/registry.ts` — `PluginRegistry` class. Add chain-aware filtering in `discover()` and `discoverHandlers()`.
- `packages/indexer/src/core/verification.ts` — Creates `UniversalProfile` and `DigitalAsset` entities with `id: addr`. Must prefix with network. Also uses `store.findBy(UniversalProfile, { id: In(uncached) })` — DB lookups must use prefixed IDs.
- `packages/indexer/src/core/multicall.ts` — Uses hardcoded `MULTICALL_ADDRESS`. Must accept from chain config.
- `packages/indexer/src/core/pipeline.ts` — 7-step pipeline. Needs `network` threaded through for entity creation and ID generation.
- `packages/indexer/src/core/batchContext.ts` — Entity bag. May need network context for ID generation.
- `packages/indexer/src/core/entityRegistry.ts` — 71-entry registry. Unchanged structurally, but entity constructors will now expect `network` field.
- `packages/indexer/schema.graphql` — 51 `@entity` types. Add `network: String! @index` to all.
- `packages/indexer/src/utils/index.ts` — `generateTokenId()`, `generateFollowId()`. Must accept network prefix.
- `packages/indexer/src/plugins/events/*.plugin.ts` — 11 plugins. Add `supportedChains` field. All use `uuidv4()` for IDs (no prefixing needed on IDs, but must set `network` field on entities).
- `packages/indexer/src/handlers/*.handler.ts` — ~25 handlers. Add `supportedChains`, set `network` on created entities, use network-prefixed deterministic IDs.
- `packages/indexer/src/handlers/chillwhales/*.handler.ts` — 4 handlers. Set `supportedChains: ['lukso']` per D013.
- `docker/docker-compose.yml` — Single indexer service. Duplicate for testnet with different env vars.
- `docker/entrypoint.sh` — Runs migrations from `packages/typeorm` (may be stale after M008). Needs updating.

### Entity ID Pattern Inventory

| Pattern | Count | Examples | Needs Network Prefix? |
|---------|-------|----------|----------------------|
| UUID (`uuidv4()`) | 11 event types | Executed, Follow, Transfer, DataChanged | **No** — UUIDs are globally unique |
| Address-as-ID | ~15 types | UniversalProfile, DigitalAsset, TotalSupply, Decimals, LSP4TokenName, LSP3Profile | **Yes** — `lukso:0xabc...` |
| `{addr} - {tokenId}` | 1 type | NFT (via `generateTokenId`) | **Yes** — `lukso:0xabc... - 0x123...` |
| `{addr} - {addr}` | 1 type | Follower (via `generateFollowId`) | **Yes** — `lukso:0xabc... - 0xdef...` |
| `{addr} - {dataKey}` | ~5 types | LSP29EncryptedAsset entries | **Yes** |
| `{addr} - {permName}` | 3 types | LSP6Permission, LSP6AllowedCall, LSP6AllowedERC725YDataKey | **Yes** |
| `BaseURI - {addr} - {tokenId}` | 1 type | LSP4MetadataBaseUri | **Yes** |

### Chain Config Registry Shape

```typescript
interface ChainConfig {
  /** Network identifier used in DB columns and ID prefixes */
  network: string;           // e.g. 'lukso', 'lukso-testnet'
  /** Human-readable display name */
  displayName: string;       // e.g. 'LUKSO Mainnet'
  /** EVM chain ID */
  chainId: number;           // e.g. 42 for LUKSO mainnet
  /** SQD archive gateway URL (optional — RPC-only if absent) */
  sqdGateway?: string;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** RPC rate limit (requests/sec) */
  rpcRateLimit: number;
  /** Finality confirmation blocks */
  finalityConfirmation: number;
  /** Multicall3 contract address */
  multicallAddress: string;
  /** LSP26 Follower System address (chain-specific) */
  lsp26Address: string;
  /** LSP23 Linked Contracts Factory address (chain-specific) */
  lsp23Address: string;
  /** Starting block for indexing */
  startBlock: number;
}
```

### Build Order

1. **Chain config registry + types** (S01) — Define `ChainConfig` type, create LUKSO mainnet + testnet configs, network prefix helper. Zero-risk, unblocks everything.
2. **Schema + network column + codegen** (S02) — Add `network: String! @index` to all 51 entities in `schema.graphql`, run codegen. This changes every entity class.
3. **Plugin/handler supportedChains + registry filtering** (S03) — Add `supportedChains` to interfaces, annotate all 11 plugins and ~25 handlers, chain-aware registry filtering.
4. **Pipeline network threading + processor factory** (S04) — Thread `network` through BatchContext → plugins → handlers → verification. Replace singleton processor with factory. Parameterize entry point via `CHAIN_ID` env var.
5. **Backfill migration** (S05, risk:high) — SQL migration to add `network` column to all existing tables, set `network = 'lukso'` for existing rows, update deterministic IDs with `lukso:` prefix, update all FK references. Must be tested against a staging DB.
6. **Per-chain Docker services** (S06) — Duplicate indexer service in docker-compose.yml with per-chain env vars. Update entrypoint.sh for chain-aware migration.
7. **LUKSO testnet proof** (S07) — Start testnet processor alongside mainnet, verify both write to shared DB, verify Hasura queries with/without network filter.

### Verification Approach

- `pnpm --filter=@chillwhales/indexer build` passes after each slice
- Schema codegen produces entities with `network` field
- `rg 'MULTICALL_ADDRESS|SQD_GATEWAY|RPC_URL' packages/indexer/src/ --no-heading` returns zero hardcoded references after S01 (only chain config references)
- All 11 plugins + ~25 handlers declare `supportedChains`
- Backfill migration SQL can be dry-run against a pg_dump of production
- `docker compose up` starts two indexer services
- Hasura query `{ universalProfile(where: { network: { _eq: "lukso" } }) { id } }` returns data

## Constraints

- **Subsquid `TypeormDatabase` uses SERIALIZABLE isolation** — two processors writing to the same DB will get serialization failures if their transactions touch overlapping rows. Per-chain records with network-prefixed IDs should not overlap, but the `status` table (Subsquid internal) will conflict. Each processor needs its own status tracking. The `TypeormDatabase` constructor accepts an `isolationLevel` option and a `stateSchema` option — the `stateSchema` must be different per chain to avoid conflicts.
- **`squid-typeorm-migration` generates from schema diff** — SQD docs recommend dropping the DB for complex schema changes. For production, we need a hand-written SQL migration that preserves existing data. The auto-generated migration will try to add `NOT NULL` columns without defaults, which will fail on existing rows.
- **Entity codegen from `schema.graphql`** — after M008, codegen runs in `packages/indexer`. The `network` column must be added to schema.graphql before any handler changes.
- **entrypoint.sh references `packages/typeorm`** — after M008, this may need updating to point to `packages/indexer` or the indexer's migration dir.
- **`MULTICALL_ADDRESS` constant** — Multicall3 is deployed at the same address on most EVM chains (`0xcA11bde05977b3631167028862bE2a173976CA11`), but LUKSO uses a different address (`0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869`). Chain config must include this.

## Common Pitfalls

- **Backfill FK cascading** — When updating a deterministic ID (e.g., `0xabc...` → `lukso:0xabc...`), every FK column that references it must also be updated in the same transaction. Missing one FK creates orphaned references. Must audit all FK relationships from `schema.graphql` before writing the migration.
- **UUID entities don't need ID prefix** — Don't reflexively prefix all IDs. Only deterministic IDs (address-based, composite) need network prefix. UUIDs are globally unique. Prefixing them would break existing data for no benefit.
- **Subsquid `stateSchema` per chain** — Two processors running against the same DB need different `stateSchema` values in `TypeormDatabase` constructor. Without this, they'll fight over the same `squid_processor.status` table and crash with serialization errors.
- **Optional `sqdGateway` in processor factory** — LUKSO testnet has no SQD gateway. The processor factory must handle `undefined` gateway gracefully by only calling `setGateway()` when the URL is present.
- **`contractFilter` addresses are chain-specific** — Plugins like `follow.plugin.ts` and `deployedProxies.plugin.ts` use `contractFilter` with hardcoded LUKSO addresses (LSP26, LSP23). These must come from chain config.

## Open Risks

- **LUKSO testnet SQD gateway does not exist.** Confirmed: the SQD public gateways page lists only `lukso-mainnet` (chain ID 42). `https://v2.archive.subsquid.io/network/lukso-testnet` returns HTTP 404. Testnet proof must use RPC-only mode. This is slower for historical sync but functional for proof-of-concept.
- **LUKSO testnet Multicall3 address** — Need to verify Multicall3 is deployed on LUKSO testnet and at what address. If absent, verification step will fail. Fallback: skip verification on testnet or deploy Multicall3.
- **LUKSO testnet LSP26/LSP23 addresses** — These system contracts may be at different addresses on testnet. Need to verify.
- **Backfill migration complexity** — The migration touches all 51 tables, updates PKs and FK references. A single missed FK creates silent data corruption. Must be validated against a staging DB copy.
- **entrypoint.sh may be stale** — M008 merged `typeorm` into `indexer`, but `entrypoint.sh` still references `packages/typeorm` for migration commands. Need to verify and fix.

## Requirement Analysis

All 9 requirements (R028–R036) are well-scoped and table-stakes for multi-chain support:

| Req | Assessment | Notes |
|-----|-----------|-------|
| R028 | Table stakes | Chain config registry — foundation for everything |
| R029 | Table stakes | Network column on all entities — required for filtering |
| R030 | Table stakes, **but scoped to deterministic IDs only** | UUID-based event entities should NOT be prefixed |
| R031 | Table stakes, risk:high | Backfill migration — riskiest slice |
| R032 | Table stakes | `supportedChains` on plugins/handlers |
| R033 | Table stakes | Processor factory replaces singleton |
| R034 | Table stakes | Per-chain Docker services |
| R035 | Table stakes, **gated on SQD gateway absence** | Must use RPC-only mode for testnet |
| R036 | Cross-cutting parity constraint | LUKSO mainnet must index identically to pre-refactor |

### Candidate Requirements (Not Yet in REQUIREMENTS.md)

- **Subsquid `stateSchema` per chain** — Each processor instance needs its own `stateSchema` in `TypeormDatabase` to avoid serialization conflicts on the status table. This is critical for simultaneous multi-chain operation and should be a requirement.
- **Graceful SQD gateway absence** — Processor factory must support RPC-only mode when no SQD gateway is configured. Required for LUKSO testnet and any future chain without SQD support.
- **Chain-specific contract addresses** — `contractFilter` addresses (LSP26, LSP23) must come from chain config, not hardcoded constants. Currently only addressed implicitly by R028.

## Sources

- SQD Public Gateways list — confirmed LUKSO testnet is NOT available (source: [SQD Network Reference](https://docs.sqd.ai/subsquid-network/reference/networks/))
- SQD TypeORM migration tool — generates from schema diff, recommends DB drop for complex changes (source: [SQD Saving to PostgreSQL](https://docs.sqd.ai/sdk/resources/persisting-data/typeorm/))
- `squid-typeorm-migration` — migrations placed at `db/migrations`, entities exported from `lib/model` (source: [squid-sdk GitHub](https://github.com/subsquid/squid-sdk/tree/master/typeorm/typeorm-migration))
