---
'@chillwhales/indexer': major
---

Multi-chain indexer infrastructure with Ethereum support.

- Add `network` column to all 71 entities
- Network-prefixed deterministic IDs (`lukso:0x...`, `ethereum:0x...`)
- Chain config registry with LUKSO mainnet, Ethereum mainnet, and Ethereum Sepolia
- Parameterized processor factory replacing singleton processor
- `supportedChains` filtering on all plugins and handlers
- Dedicated migrations container (replaces leader/follower SKIP_MIGRATIONS pattern)
- Docker Compose with 3 indexer services sharing one PostgreSQL

BREAKING: Requires full re-index. All entity PKs and FKs now include network prefix.
