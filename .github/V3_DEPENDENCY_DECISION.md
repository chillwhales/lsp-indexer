# V3 dependency decision record

Status: accepted for pinned shadow validation; production cutover still requires owner acceptance
of the prerelease/support and license obligations below.

Date: 2026-08-25

## Selected runtime

| Boundary                      | Exact version    |
| ----------------------------- | ---------------- |
| Node.js image/minimum         | `22.15.0`        |
| pnpm                          | `10.15.0`        |
| `@subsquid/pipes`             | `1.0.0-alpha.22` |
| `@subsquid/evm-normalization` | `0.0.2`          |
| `@subsquid/evm-rpc`           | `0.0.2`          |
| `@subsquid/http-client`       | `1.8.1`          |
| `@subsquid/rpc-client`        | `4.16.0`         |
| `drizzle-orm`                 | `0.44.7`         |
| `pg`                          | `8.16.3`         |
| `viem`                        | `2.47.0`         |
| `zod`                         | `4.3.6`          |

The package manifest and lockfile pin the runtime boundary exactly. Alpha.22 is an official
Subsquid prerelease and includes the official EVM RPC/fallback source used by v3. LUKSO can read its
historical finalized Portal first and then follow the live official RPC source; no v2 processor or
locally maintained source adapter is retained.

Primary references:

- [Pipes v1.0.0-alpha.22 release](https://github.com/subsquid/pipes-sdk/releases/tag/pipes-v1.0.0-alpha.22)
- [Official RPC/fallback implementation](https://github.com/subsquid/pipes-sdk/pull/156)
- [Bounded tail/finality issue](https://github.com/subsquid/pipes-sdk/pull/143)
- [Drizzle snapshot evolution issue](https://github.com/subsquid/pipes-sdk/issues/150)

## Known upstream risks and controls

1. `@subsquid/pipes` remains a prerelease. No production SLA is recorded in the package or release.
   We pin an exact build, build it into an immutable image, monitor upstream releases, and require
   the repository owner to accept community/upstream support expectations before cutover.
2. Bounded source completion can precede an expected finalized tail while pipes-sdk#143 remains
   open. Source probes require every requested block, and formal parity requires the committed
   `indexed_head.block_number` and `finalized_block_number` to equal the requested bound. Process
   exit alone is never accepted.
3. The released Drizzle target does not migrate existing rollback snapshots after tracked schema
   changes while pipes-sdk#150 remains open. The v3 migrator inventories artifacts and refuses an
   unsafe change. The recovery runbook requires a verified backup and either a tested preservation
   transform or an explicitly reviewed v3-only destructive replay with every v3 writer stopped.
4. The Pipes package brings unused chain adapters into the production dependency graph. The image
   build is monitored for size and vulnerabilities; removing those adapters depends on upstream
   package factoring rather than a local fork.

## License inventory

`pnpm licenses list --prod --filter @chillwhales/indexer-v3 --json` completed on 2026-08-25. The
production graph reports SPDX families Apache-2.0, BSD-3-Clause, GPL-3.0-or-later, ISC, MIT, and
MPL-2.0; it reports no package with a missing or unknown license.

Pipes itself is MIT. Its EVM RPC peers and multiple Subsquid transitive utilities are
GPL-3.0-or-later, and `@ethereumjs/mpt`, `@ethereumjs/rlp`, and `@ethereumjs/util` are also reported
GPL-3.0-or-later in this resolved graph. Shipping a container or hosted service may carry obligations
that this engineering record does not interpret. Before a public release, the owner must record the
project's approved compliance treatment, source/notices delivery, and whether legal review is
required. A green technical test does not close that decision.

## Upgrade policy

Every Pipes upgrade gets its own reviewed change. It must rerun source readiness, live Portal/RPC
handoff, bounded-finality proof, persistence/reorg/fault integration, Hasura, package, image, Helm,
parity, and recovery checks. Floating tags and unreviewed lockfile refreshes are prohibited.
