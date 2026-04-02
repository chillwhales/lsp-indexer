---
verdict: needs-attention
remediation_round: 0
---

# Milestone Validation: M009

## Success Criteria Checklist
## Success Criteria (from Slice "After this" definitions)

### S01: Chain-Aware Indexer Core
- [x] **pnpm build passes** — Confirmed: `pnpm --filter=@chillwhales/indexer build` exits 0, 306/306 tests pass
- [x] **All entities have network field** — Confirmed: 71 entities with `network: String! @index` (exceeds planned 51 — schema grew during implementation)
- [x] **ChainConfig registry exists** — Confirmed: `packages/indexer/src/config/chainConfig.ts` exists with LUKSO mainnet/testnet configs
- [x] **Processor factory replaces singleton** — Confirmed: `processorFactory.ts` exists, `processor.ts` deleted
- [x] **supportedChains on all plugins/handlers** — Confirmed: 11 event plugins + 29 handlers have supportedChains
- [~] **Zero hardcoded LUKSO constants in src/** — PARTIAL: `rg` found no SQD_GATEWAY or MULTICALL_ADDRESS hardcodes, but 2 plugins (`deployedContracts.plugin.ts`, `deployedProxies.plugin.ts`) retain local `LSP23_ADDRESS` constant. Documented as known limitation in S01 summary.

### S02: Backfill Migration
- [x] **SQL migration covers all tables** — Confirmed: 137 UPDATEs, 71 DISABLE/ENABLE TRIGGER ALL, 71 ADD COLUMN IF NOT EXISTS
- [x] **Idempotency guards on every UPDATE** — Confirmed: 137 `NOT LIKE 'lukso:%'` guards matching 137 UPDATEs
- [x] **FK integrity verification script** — Confirmed: verify-backfill.sql exists with 103 NOT EXISTS checks
- [x] **LSP12IssuedAssets handler fixed** — Confirmed: 6 prefixId references in handler
- [x] **Docker entrypoint wired** — Confirmed: `backfill-network.sql` referenced in entrypoint.sh
- [ ] **Live database migration test** — NOT TESTED: Only structural/syntactic verification performed. Requires production-like PostgreSQL with real LUKSO data.

### S03: Dual-Chain Docker + Testnet Proof
- [x] **Both services in docker-compose.yml** — Confirmed: `indexer` (CHAIN_ID=lukso) and `indexer-testnet` (CHAIN_ID=lukso-testnet)
- [x] **Leader/follower pattern** — Confirmed: testnet has `SKIP_MIGRATIONS: "true"`, depends on mainnet with `service_healthy` condition
- [x] **postgresql-client in Dockerfile** — Confirmed: `apk add --no-cache postgresql-client`
- [x] **SQL files copied into image** — Confirmed: COPY line for `*.sql` migrations
- [x] **Testnet env vars documented** — Confirmed: CHAIN_ID, RPC_URL_TESTNET, RPC_RATE_LIMIT_TESTNET in .env.example
- [ ] **docker compose up starts both processors** — NOT TESTED: No Docker daemon available. Static config validation only.
- [ ] **Hasura query with network filter** — NOT TESTED: Requires live running stack with Hasura.

## Slice Delivery Audit
| Slice | Claimed Deliverable | Evidence | Verdict |
|-------|---------------------|----------|---------|
| S01 | ChainConfig registry, network on all entities, prefixId, processorFactory, supportedChains | chainConfig.ts exists, 71 entities with network field, processorFactory.ts exists, processor.ts deleted, 40 plugins/handlers with supportedChains, 306 tests pass | ✅ Delivered |
| S02 | Idempotent backfill SQL (33 PK + 103 FK), verify script, LSP12 fix, Docker entrypoint | 137 UPDATEs with idempotency guards, 71 tables covered, verify-backfill.sql with 103 checks, 6 prefixId calls in LSP12 handler, entrypoint.sh wired | ✅ Delivered |
| S03 | Dual-chain Docker services, SKIP_MIGRATIONS, testnet service, env documentation | Both services in compose with correct CHAIN_IDs, leader/follower pattern, postgresql-client installed, SQL files copied, .env.example updated | ✅ Delivered (structural — no live test) |

## Cross-Slice Integration
### S01 → S02 Boundary
- S01 provides: network column on all 71 entities, prefixId() utility
- S02 consumes: Writes SQL migration targeting all 71 tables with network column, uses prefixId pattern for PK/FK updates
- **Status: ✅ Aligned** — S02's 71 ADD COLUMN + 33 PK + 103 FK updates match S01's schema

### S01 → S03 Boundary
- S01 provides: ChainConfig registry, CHAIN_ID-parameterized processor
- S03 consumes: Uses CHAIN_ID env var in docker-compose.yml for both services
- **Status: ✅ Aligned** — CHAIN_ID=lukso and CHAIN_ID=lukso-testnet match ChainConfig entries

### S02 → S03 Boundary
- S02 provides: Backfill SQL migration, Docker entrypoint integration
- S03 consumes: Dockerfile copies SQL files, entrypoint runs migration (leader only)
- **Status: ✅ Aligned** — Dockerfile COPY and entrypoint.sh reference backfill-network.sql correctly

### No Boundary Mismatches Detected

## Requirement Coverage
### Requirements Addressed
- **R034** (docker-compose.yml with separate indexer services per chain): ✅ Advanced by S03 — docker-compose.yml has `indexer` (mainnet) and `indexer-testnet` services with chain-specific env vars, writing to shared Postgres
- **R035** (LUKSO testnet as second processor): ✅ Advanced by S03 — testnet service configured with CHAIN_ID=lukso-testnet, RPC-only (no gateway per D017), depends on mainnet leader

### No Unaddressed Active Requirements for M009

## Verification Class Compliance
### Contract Verification
- **pnpm build passes:** ✅ Confirmed across all 3 slices (exit 0)
- **71 entities with network: String! @index:** ✅ Confirmed (grep count = 71, exceeds planned 51)
- **Zero hardcoded LUKSO constants:** ⚠️ PARTIAL — rg finds no SQD_GATEWAY/MULTICALL_ADDRESS hardcodes, but 2 plugins retain local LSP23_ADDRESS. Documented known limitation.
- **Compliance: PASS with documented exception**

### Integration Verification
- **LUKSO mainnet processor starts with CHAIN_ID=lukso:** ⚠️ Structural evidence only — processorFactory.ts + ChainConfig exist and build passes, but no live boot test
- **Testnet processor alongside mainnet:** ⚠️ Docker config validated (both services parse), but no live dual-process test
- **Compliance: PARTIAL — code-level integration proven, runtime integration deferred to deployment**

### Operational Verification
- **docker compose up starts both services:** ⚠️ NOT TESTED — no Docker daemon in CI. Static validation: `docker compose config --services` shows both services, config parses cleanly
- **Hasura auto-tracks network column:** ⚠️ NOT TESTED — requires running Hasura instance
- **Compliance: DEFERRED — no Docker daemon available for operational testing**

### UAT Verification
- **Hasura filtered query returns chain-specific data:** ⚠️ NOT TESTED — requires full running stack
- **Query without filter returns both chains:** ⚠️ NOT TESTED
- **No ID collisions:** ✅ Structural guarantee via prefixId('lukso:', ...) and prefixId('lukso-testnet:', ...) patterns
- **Compliance: DEFERRED — UAT test procedures documented but require live environment**


## Verdict Rationale
**Verdict: needs-attention** (not needs-remediation)

All three slices delivered their code-level artifacts as planned. The structural transformation to multi-chain is complete: 71 entities have network fields, ChainConfig registry works, processor factory is parameterized, all plugins/handlers have supportedChains, backfill migration covers all 71 tables with idempotency, and Docker infrastructure defines dual-chain services.

**Gaps are environmental, not code-level:**
1. **LSP23_ADDRESS in 2 plugins** — Minor; these are LUKSO-specific plugins with `supportedChains: ['lukso']`, so the hardcoded address is functionally correct for their scope. Documented as known limitation.
2. **No live database migration test** — Expected; requires production-like PostgreSQL. verify-backfill.sql provides the post-migration validation tool.
3. **No Docker build/run test** — Expected; no Docker daemon in CI. Config validates cleanly.
4. **No Hasura query test** — Expected; requires full stack. UAT procedures are documented for manual execution.
5. **Entity count 71 vs planned 51** — Positive deviation; schema grew during implementation.

None of these gaps represent missing code or incomplete features. The milestone vision — "make the Subsquid indexer structurally multi-chain" — is achieved at the code level. Runtime verification is deferred to deployment environments where Docker/Postgres/Hasura are available.
