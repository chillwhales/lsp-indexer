# S03: Dual-Chain Docker + Testnet Proof

**Goal:** Define per-chain Docker services with separate CHAIN_ID, stateSchema, and RPC config. Fix stale entrypoint.sh. Configure TypeormDatabase with per-chain stateSchema to avoid serialization conflicts. Start LUKSO testnet processor in RPC-only mode (no SQD gateway). Verify dual-chain operation end-to-end through Hasura.
**Demo:** After this: docker compose up starts LUKSO mainnet + testnet processors simultaneously. Both write to shared PostgreSQL. Hasura query with network filter returns chain-specific data. Query without filter returns both chains. No ID collisions.

## Tasks
