# `@chillwhales/indexer-v3`

Multi-chain LSP indexer built from scratch on the SQD Pipes SDK.

> **Alpha foundation:** this package currently provides the typed network catalog, validated
> single-network runtime, Portal and RPC readiness checks, Pipes EVM source construction, and a
> bounded source probe. It does not yet persist or expose LSP domain data and is not a replacement
> for the production v2 indexer.

## Requirements

- Node.js 22.15 or newer
- pnpm 10.15
- An RPC endpoint for the selected EVM network
- An SQD Portal dataset that covers the requested range

Dependencies that define the runtime boundary are pinned exactly, including
`@subsquid/pipes@1.0.0-beta.3`.

## Network model

Production runs one process or container per network. Each configured network has a stable EIP-155
Pipes identity and a separate PostgreSQL schema reserved for the persistence work in #382.

| Network key        | Chain ID | Pipes stream ID                  | Database schema          |
| ------------------ | -------: | -------------------------------- | ------------------------ |
| `lukso-mainnet`    |       42 | `lsp-indexer:v3:eip155:42`       | `chain_lukso_mainnet`    |
| `ethereum-mainnet` |        1 | `lsp-indexer:v3:eip155:1`        | `chain_ethereum_mainnet` |
| `ethereum-sepolia` | 11155111 | `lsp-indexer:v3:eip155:11155111` | `chain_ethereum_sepolia` |

Well-known LSP23 and LSP26 deployments are optional typed capabilities in the same registry. A
contract that is not deployed is absent; v3 never substitutes the zero address. This lets later
domain decoders derive their contract filters from configuration instead of per-plugin chain lists.

The Pipes `devRunner` wrapper is available for local multi-network development only. Production
must keep network processes isolated so a crash, CPU spike, or provider failure on one chain does
not stop another.

## Configuration

| Variable                          | Required | Purpose                                                     |
| --------------------------------- | -------- | ----------------------------------------------------------- |
| `INDEXER_NETWORK`                 | Yes      | Network key from the catalog                                |
| `INDEXER_FROM_BLOCK`              | No       | Inclusive start block; defaults to the network start block  |
| `INDEXER_TO_BLOCK`                | No       | Inclusive end block; required by the bounded source probe   |
| `SQD_PORTAL_URL`                  | No       | Override the selected network's Portal dataset URL          |
| `RPC_URL`                         | No       | Generic RPC override                                        |
| `RPC_URL_LUKSO_MAINNET`           | No       | LUKSO-specific RPC override; takes priority over `RPC_URL`  |
| `RPC_URL_ETHEREUM_MAINNET`        | No       | Ethereum-specific RPC override                              |
| `RPC_URL_ETHEREUM_SEPOLIA`        | No       | Sepolia-specific RPC override                               |
| `INDEXER_ALLOW_HISTORICAL_SOURCE` | No       | Explicitly permit an unbounded run against a historical set |
| `INDEXER_METRICS_PORT`            | No       | Local runner metrics port; defaults to `9090`               |

URLs, ranges, boolean values, the network key, Portal dataset identity, Portal coverage, RPC chain
ID, and configured contract bytecode are validated before a network program starts. A
network-specific RPC variable takes priority over the generic `RPC_URL`.

## Commands

Check that a Portal and RPC endpoint match a configured network:

```bash
INDEXER_NETWORK=ethereum-mainnet \
  pnpm --filter @chillwhales/indexer-v3 check:network
```

Exercise the real Pipes source with a deliberately small, bounded raw-log range:

```bash
INDEXER_NETWORK=ethereum-mainnet \
INDEXER_FROM_BLOCK=22000000 \
INDEXER_TO_BLOCK=22000010 \
  pnpm --filter @chillwhales/indexer-v3 probe:network
```

The probe reports batches, blocks, logs, and the network-scoped stream identity. It refuses to run
without `INDEXER_TO_BLOCK` and fails if the source does not return both requested range boundaries;
it is a source diagnostic, not the domain indexer.

Run local validation:

```bash
pnpm --filter @chillwhales/indexer-v3 typecheck
pnpm --filter @chillwhales/indexer-v3 test:coverage
pnpm --filter @chillwhales/indexer-v3 build
```

## Current source gate

The LUKSO Mainnet Portal dataset currently reports that it is not real-time. Bounded historical
ranges are safe to probe. An unbounded historical run requires
`INDEXER_ALLOW_HISTORICAL_SOURCE=true`, but that opt-in does not make the source live. Production
cutover remains blocked until an official real-time Portal or Pipes RPC source passes the recovery
and reorg acceptance suite.

See the repository's [v3 architecture](../../.github/V3_ARCHITECTURE.md),
[roadmap](../../.github/V3_ROADMAP.md), and
[acceptance gates](../../.github/V3_ACCEPTANCE_GATES.md).
