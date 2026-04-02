# M009: 

## Vision
Make the Subsquid indexer structurally multi-chain. Replace all hardcoded LUKSO constants with a typed chain config registry. Add a `network` column to every entity. Prefix deterministic IDs with network name. Migrate existing LUKSO data. Add `supportedChains` to every plugin/handler. Build a parameterized processor factory. Define per-chain Docker services. Prove it works by running LUKSO mainnet + testnet simultaneously.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Chain-Aware Indexer Core | medium | — | ✅ | Start indexer with CHAIN_ID=lukso — it boots, processes blocks, writes entities with network='lukso'. pnpm build passes with all 51 entities having network field. Zero hardcoded LUKSO constants remain in src/. |
| S02 | Backfill Migration | high | S01 | ⬜ | Apply SQL migration to a PostgreSQL database with existing LUKSO data. All rows get network='lukso'. All deterministic IDs are prefixed with 'lukso:'. All FK references updated consistently. Row counts preserved. FK constraint checks pass. |
| S03 | Dual-Chain Docker + Testnet Proof | medium | S01, S02 | ⬜ | docker compose up starts LUKSO mainnet + testnet processors simultaneously. Both write to shared PostgreSQL. Hasura query with network filter returns chain-specific data. Query without filter returns both chains. No ID collisions. |
