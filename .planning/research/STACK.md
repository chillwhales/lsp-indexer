# Stack Research

**Project:** LSP Indexer V2
**Researched:** 2026-02-06
**Mode:** Ecosystem — Stack dimension for Subsquid-based LUKSO indexer

## Current Stack Assessment

The existing stack is **well-chosen and current**. No major technology migrations are needed for the V2 completion milestone. Below is a detailed assessment of each component.

### Core Framework: Subsquid SDK

| Component                        | Current Version | Status | Assessment                                       |
| -------------------------------- | --------------- | ------ | ------------------------------------------------ |
| `@subsquid/evm-processor`        | 1.27.2          | Stable | **Keep** — latest stable on the gateway API line |
| `@subsquid/typeorm-store`        | 1.5.1           | Stable | **Keep** — latest stable                         |
| `@subsquid/evm-abi`              | 0.3.1           | Stable | **Keep**                                         |
| `@subsquid/evm-codec`            | 0.3.0           | Stable | **Keep**                                         |
| `@subsquid/evm-typegen`          | 4.4.0           | Stable | **Keep**                                         |
| `@subsquid/typeorm-codegen`      | 2.0.2           | Stable | **Keep**                                         |
| `@subsquid/typeorm-migration`    | 1.3.0           | Stable | **Keep**                                         |
| `@subsquid/hasura-configuration` | 2.0.0           | Stable | **Keep**                                         |

**Key finding: SQD Portal API (future direction)**

SQD is actively developing a new "Portal API" that replaces the gateway-based `setGateway()` with a stream-based `setPortal()`. This involves a **different npm package line** (`@subsquid/evm-processor@portal-api`), and the newest iteration (`@subsquid/evm-stream@portal-api` + `@subsquid/batch-processor@portal-api`) fully replaces `@subsquid/evm-processor`.

**Recommendation:** Do NOT migrate to Portal API during V2 completion. The Portal SDK is in open beta and introduces significant API changes (different imports, `DataSourceBuilder` instead of `EvmBatchProcessor`, `where-include-range` syntax, manual logger creation). The current gateway API (`v2.archive.subsquid.io/network/lukso-mainnet`) is stable and fully supported. Plan the Portal migration as a separate post-V2 milestone.

**Confidence: HIGH** — Verified via official SQD docs at `docs.sqd.dev/migrate-to-portal-sdk/` and `docs.sqd.dev/migrate-to-portal-with-real-time-data-on-evm/`.

### EVM Utilities: Viem

| Component | Current Version | Latest Specifier | Assessment                |
| --------- | --------------- | ---------------- | ------------------------- |
| `viem`    | ^2.33.2         | ^2.33.2          | **Keep** — correct choice |

Viem is the clear winner over ethers.js for EVM utilities in 2025-2026:

- **Tree-shakeable** — only imports what you use, smaller bundle
- **Type-safe** — first-class TypeScript with strong inference
- **Performance** — optimized for modern JS runtimes
- **Active development** — faster release cadence than ethers v6
- **Native BigInt** — no need for `BigNumber` wrapper class

This project uses viem correctly — for hex conversion, boolean parsing, and EVM data encoding/decoding utilities. The codebase does NOT use viem as an RPC client (Subsquid handles RPC), which is the ideal pattern.

ethers.js v6 is still maintained but:

- Larger bundle size
- Less ergonomic TypeScript experience
- Slower adoption of modern JS patterns
- Community momentum has shifted to viem

**Confidence: HIGH** — Based on ecosystem-wide adoption patterns and official documentation.

### ORM: TypeORM

| Component | Current Version | Assessment                      |
| --------- | --------------- | ------------------------------- |
| `typeorm` | ^0.3.25         | **Keep** — required by Subsquid |

TypeORM 0.3.x is the version required by `@subsquid/typeorm-store`. The project cannot switch to an alternative ORM (Drizzle, Prisma, MikroORM) without losing Subsquid integration.

**Batch upsert best practices for Subsquid TypeORM Store:**

The `context.store` interface from `@subsquid/typeorm-store` provides:

- `upsert(entities: E[])` — INSERT OR UPDATE on conflict. **Does not cascade to relations.** This is the correct method for data key entities where latest value wins.
- `insert(entities: E[])` — Primitive INSERT, fails on duplicate. Use for event entities (unique UUIDs).
- `remove(Entity, ids)` — Delete by IDs. **Does not cascade.**

Key patterns already correctly used in this codebase:

1. **Events use `insert()`** — UUID-keyed, append-only
2. **Data keys use `upsert()`** — Address-keyed, latest value wins
3. **Core entities use `upsert()`** — For UniversalProfile, DigitalAsset, NFT

**Pitfall to watch:** `upsert()` does NOT cascade to relations. This means sub-entities (like LSP3ProfileImage, LSP4MetadataAttribute) must be explicitly cleared before re-inserting. The V1 codebase already handles this via `clearSubEntities()` — ensure V2 replicates this pattern.

**Confidence: HIGH** — Verified via official SQD docs at `docs.sqd.dev/sdk/reference/store/typeorm/`.

### Runtime: Node.js 22

| Component | Current Version | Assessment                       |
| --------- | --------------- | -------------------------------- |
| Node.js   | 22 (Alpine)     | **Keep** — LTS, excellent choice |

Node.js 22 (LTS since October 2024) provides:

- **Stable `worker_threads`** — Used by Subsquid internally for data decoding; suitable for metadata worker thread pools if the V2 enrichment queue architecture needs them
- **Native `fetch()`** — Could replace axios for simpler HTTP calls (but not urgent)
- **Performance** — V8 engine improvements benefit batch processing throughput
- **ESM improvements** — Though project uses CommonJS (required by TypeORM decorators + ts-node), no urgency to change

**Worker threads consideration:** The V2 architecture mentions "metadata worker thread pool" (#18). Node.js 22 has a fully stable `worker_threads` API. For CPU-bound work (JSON parsing), workers help. For I/O-bound work (IPFS fetching), `Promise.allSettled()` with concurrency limiting is simpler and sufficient. Given that metadata fetching is primarily I/O-bound (HTTP requests to IPFS gateways), recommend using async concurrency control (e.g., p-limit or manual batching) rather than worker threads unless CPU parsing becomes a bottleneck.

**Confidence: HIGH** — Based on Node.js official release schedule and feature documentation.

### Build Tooling

| Component      | Current Version | Assessment                                   |
| -------------- | --------------- | -------------------------------------------- |
| TypeScript     | ^5.9.2          | **Keep** — latest                            |
| pnpm           | 10.15.0         | **Keep** — latest line                       |
| ts-node        | ^10.9.2         | **Keep** — required for runtime TS execution |
| tsconfig-paths | ^4.2.0          | **Keep** — for `@/*` alias resolution        |
| Prettier       | ^3.5.3          | **Keep**                                     |

No changes needed. The build tooling is current.

### Infrastructure

| Component             | Current Version    | Assessment                           |
| --------------------- | ------------------ | ------------------------------------ |
| PostgreSQL            | 17-alpine          | **Keep** — latest stable             |
| Hasura GraphQL Engine | v2.46.0            | **Keep** — recent stable             |
| Docker                | Single-stage build | **Improve** — see Deployment section |

### Supporting Libraries

| Library             | Current Version | Assessment                                                                    |
| ------------------- | --------------- | ----------------------------------------------------------------------------- |
| `axios`             | ^1.11.0         | **Keep** for now — could consider native `fetch()` later                      |
| `@erc725/erc725.js` | ^0.28.1         | **Keep** — LUKSO-specific, required for VerifiableURI decoding                |
| `dotenv`            | ^17.2.1         | **Keep**                                                                      |
| `data-urls`         | ^5.0.0          | **Keep** — for data: URI parsing                                              |
| `uuid`              | ^11.1.0         | **Keep** — could use `crypto.randomUUID()` (Node.js 22 native) but not urgent |

## Recommendations

### Immediate (Do During V2 Completion)

1. **No version bumps needed** — All current versions are at or near latest stable. Pin exact versions in the lockfile (already done via pnpm-lock.yaml).

2. **Structured logging pattern** — Use Subsquid's built-in `context.log` with JSON-structured messages. See Logging Patterns section below for details.

3. **Consider `crypto.randomUUID()`** — Could replace `uuid` package for entity ID generation since Node.js 22 includes this natively. Minor optimization, not urgent.

### Post-V2 (Future Milestones)

1. **Portal SDK migration** — When SQD Portal exits beta and LUKSO mainnet is confirmed supported with real-time data, migrate from `setGateway()` to `setPortal()`. This is a significant API change requiring a dedicated milestone:

   - Replace `@subsquid/evm-processor` with `@subsquid/evm-stream@portal-api` + `@subsquid/batch-processor@portal-api`
   - Rewrite processor config to use `DataSourceBuilder` with `where-include-range` syntax
   - Add `@subsquid/logger` for manual logger creation
   - Benefit: 5-10x faster historical sync, reduced RPC dependency, native finality handling

2. **Multi-stage Docker build** — Current Dockerfile copies all source. A multi-stage build would reduce image size. See Deployment section.

3. **Replace axios with native fetch** — Node.js 22 has a stable global `fetch()`. Would eliminate a dependency. Low priority.

4. **Hasura v3 evaluation** — Hasura v3 (Hasura DDN) is a significant rewrite. The current v2.46.0 is stable and supported. Evaluate v3 only if v2 EOL is announced.

### Not Recommended

1. **DO NOT migrate to Drizzle/Prisma/MikroORM** — Subsquid's `TypeormDatabase` store is tightly integrated and generates entities from `schema.graphql`. Switching ORMs would break the entire codegen pipeline.

2. **DO NOT switch to ethers.js** — Viem is the better choice. The project already uses it correctly.

3. **DO NOT add GraphQL subscriptions** — Hasura handles the GraphQL layer. No custom resolvers needed per project constraints.

4. **DO NOT add Redis/message queues** — The enrichment queue architecture works in-process. External queues add infrastructure complexity without benefit for this use case.

## Version Notes

### Current Versions (All Correct)

| Package                          | In package.json | Resolved | Latest Stable         | Action                    |
| -------------------------------- | --------------- | -------- | --------------------- | ------------------------- |
| `@subsquid/evm-processor`        | ^1.27.2         | 1.27.2   | 1.27.2 (gateway line) | None                      |
| `@subsquid/typeorm-store`        | ^1.5.1          | 1.5.1    | 1.5.1                 | None                      |
| `@subsquid/evm-typegen`          | ^4.4.0          | 4.4.0    | 4.4.0                 | None                      |
| `@subsquid/typeorm-codegen`      | ^2.0.2          | 2.0.2    | 2.0.2                 | None                      |
| `@subsquid/hasura-configuration` | ^2.0.0          | 2.0.0    | 2.0.0                 | None                      |
| `viem`                           | ^2.33.2         | 2.33.2+  | ~2.x (active)         | None (auto-updates via ^) |
| `typeorm`                        | ^0.3.25         | 0.3.25   | 0.3.x                 | None                      |
| `typescript`                     | ^5.9.2          | 5.9.2    | 5.9.x                 | None                      |
| Node.js                          | 22-alpine       | 22.x     | 22.x LTS              | None                      |
| PostgreSQL                       | 17-alpine       | 17.x     | 17.x                  | None                      |
| Hasura                           | v2.46.0         | 2.46.0   | 2.46.x                | None                      |

### Portal API Versions (Future — Do Not Adopt Yet)

| Package                     | Version     | Purpose                         |
| --------------------------- | ----------- | ------------------------------- |
| `@subsquid/evm-stream`      | @portal-api | Replaces evm-processor          |
| `@subsquid/evm-objects`     | @portal-api | Block augmentation utilities    |
| `@subsquid/batch-processor` | @portal-api | New `run()` function            |
| `@subsquid/logger`          | latest      | Manual logger for Portal SDK    |
| `@subsquid/rpc-client`      | latest      | Explicit RPC client (if needed) |

## Logging Patterns

### Subsquid Logger Architecture

Subsquid provides a built-in `Logger` interface injected as `ctx.log` in the batch handler context. It is bound to the namespace `sqd:processor:mapping`.

**Available log levels (increasing severity):**

- `TRACE` — Verbose debugging (disabled by default)
- `DEBUG` — Detailed debugging
- `INFO` — Standard operational messages (default minimum level)
- `WARN` — Warning conditions
- `ERROR` — Error conditions
- `FATAL` — Unrecoverable errors

**Confidence: HIGH** — Verified via official SQD docs at `docs.sqd.dev/sdk/reference/logger/`.

### Current Logging Pattern (V1)

The V1 codebase uses `context.log.info(JSON.stringify({...}))` throughout. This works but has issues:

- Manual `JSON.stringify()` on every call
- All messages at `INFO` level — no severity differentiation
- No consistent structure across log sites

### Recommended Pattern for V2

**1. Centralized logger utility:**

```typescript
// src/utils/logger.ts
import { Context } from '@/types';

interface LogFields {
  [key: string]: string | number | boolean | null | undefined;
}

export function createLogger(context: Context) {
  return {
    trace: (message: string, fields?: LogFields) =>
      context.log.trace(JSON.stringify({ message, ...fields })),
    debug: (message: string, fields?: LogFields) =>
      context.log.debug(JSON.stringify({ message, ...fields })),
    info: (message: string, fields?: LogFields) =>
      context.log.info(JSON.stringify({ message, ...fields })),
    warn: (message: string, fields?: LogFields) =>
      context.log.warn(JSON.stringify({ message, ...fields })),
    error: (message: string, fields?: LogFields) =>
      context.log.error(JSON.stringify({ message, ...fields })),
  };
}
```

**2. Severity usage guidelines:**

| Level   | When to Use                     | Example                                       |
| ------- | ------------------------------- | --------------------------------------------- |
| `TRACE` | Per-entity processing details   | "Processing DataChanged for 0x..."            |
| `DEBUG` | Batch-level processing stats    | "Batch contains 45 logs across 12 blocks"     |
| `INFO`  | Significant operational events  | "Saving 23 new UniversalProfile entities"     |
| `WARN`  | Recoverable issues              | "Metadata fetch failed (retry 2/5) for 0x..." |
| `ERROR` | Non-recoverable issues in batch | "Multicall verification failed for 0x..."     |

**3. Log level control via environment:**

```bash
# Default: INFO and above
SQD_DEBUG=sqd:processor:mapping  # Enable DEBUG for processor
SQD_TRACE=sqd:processor*         # Enable TRACE for all processor internals
```

**4. Consistent field schema:**

```typescript
// Event processing
log.info('Events processed', {
  executed: populatedExecuteEntities.length,
  dataChanged: populatedDataChangedEntities.length,
  transfers: populatedTransferEntities.length,
  blockRange: `${firstBlock}-${lastBlock}`,
});

// Entity verification
log.info('Entities verified', {
  newProfiles: newUniversalProfiles.size,
  validProfiles: validUniversalProfiles.size,
  invalidProfiles: invalidUniversalProfiles.size,
});

// Metadata fetching
log.debug('Metadata fetch batch', {
  total: unfetchedCount,
  batchSize: FETCH_BATCH_SIZE,
  retryable: retryableCount,
});

// Errors
log.warn('Metadata fetch failed', {
  entityId: entity.id,
  url: entity.url,
  retryCount: entity.retryCount,
  error: error.message,
});
```

**Note:** These patterns are for stdout-based logging. No external logging service (Loki, ELK, Datadog) is needed for self-hosted Docker deployment. If monitoring is needed later, structured JSON logs can be shipped to any log aggregator via Docker log drivers.

## Deployment

### Current Docker Setup (V1)

The existing setup works but has optimization opportunities:

**Current Dockerfile (single-stage):**

```dockerfile
FROM node:22-alpine AS base
RUN apk add --no-cache git
WORKDIR /app
COPY . .
RUN corepack enable pnpm && pnpm install
RUN pnpm build
RUN chmod 755 start.sh
ENTRYPOINT [ "sh", "-c" ]
CMD [ "./start.sh" ]
```

**Issues:**

1. Copies entire source tree including dev files
2. No multi-stage build — image includes dev dependencies, source, and build artifacts
3. No `.dockerignore` reducing context size
4. `start.sh` runs migrations on every container start

### Recommended Docker Setup for V2

**Multi-stage Dockerfile:**

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/abi/package.json packages/abi/
COPY packages/typeorm/package.json packages/typeorm/
COPY packages/indexer/package.json packages/indexer/
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:22-alpine AS production
RUN apk add --no-cache git curl
WORKDIR /app
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/package.json ./
COPY --from=builder /app/packages/abi/package.json /app/packages/abi/lib/ packages/abi/
COPY --from=builder /app/packages/typeorm/package.json /app/packages/typeorm/lib/ /app/packages/typeorm/db/ packages/typeorm/
COPY --from=builder /app/packages/typeorm/schema.graphql packages/typeorm/
COPY --from=builder /app/packages/indexer/package.json /app/packages/indexer/lib/ packages/indexer/
COPY --from=builder /app/start.sh /app/env.sh ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod
RUN chmod 755 start.sh
ENTRYPOINT [ "sh", "-c" ]
CMD [ "./start.sh" ]
```

**Note:** This is an aspirational target. For V2 completion, the existing single-stage Dockerfile is fine. Optimize after V2 is validated.

### Self-Hosted vs SQD Cloud

| Factor           | Self-Hosted (Current)   | SQD Cloud            |
| ---------------- | ----------------------- | -------------------- |
| **Cost**         | VPS cost (~$20-50/mo)   | Per-resource pricing |
| **Control**      | Full control over infra | Managed              |
| **Hasura**       | Self-managed v2.46.0    | Available as addon   |
| **PostgreSQL**   | Self-managed            | Managed addon        |
| **Monitoring**   | DIY (Docker logs)       | Built-in metrics     |
| **Deployment**   | `docker compose up`     | `sqd deploy`         |
| **Custom infra** | Full flexibility        | Some constraints     |

**Recommendation:** Stay self-hosted for V2 completion. The existing Docker + VPS + Hasura setup works, matches V1, and avoids migration risk during the rewrite. SQD Cloud is a viable option for future consideration if operational overhead becomes a concern, but it would require adding a `squid.yaml` manifest and potentially adjusting the Hasura configuration.

**Confidence: HIGH** — Verified via official SQD Cloud docs at `docs.sqd.dev/cloud/overview/` and self-hosting guide at `docs.sqd.dev/sdk/resources/self-hosting/`.

### Docker Compose Health Checks

The current `docker-compose.yaml` already has proper health checks for PostgreSQL and Hasura with `depends_on: condition: service_healthy`. This is correct and follows Subsquid self-hosting best practices.

### Start Script Improvement

The current `start.sh` always runs migration generation + application on every container start. This is safe but slow. Consider:

```bash
#!/bin/sh
set -e

# Generate and apply migrations
pnpm migration:generate
pnpm migration:apply

# Configure Hasura
pnpm hasura:generate
pnpm hasura:apply

# Start the indexer
exec pnpm start
```

The `exec` ensures the Node.js process becomes PID 1 and receives signals properly for graceful shutdown. This is a minor improvement but important for Docker container lifecycle management.

## Sources

- **SQD SDK Overview:** https://docs.sqd.dev/sdk/overview/ (HIGH confidence)
- **SQD EvmBatchProcessor Reference:** https://docs.sqd.dev/sdk/reference/processors/evm-batch/ (HIGH confidence)
- **SQD TypeORM Store Reference:** https://docs.sqd.dev/sdk/reference/store/typeorm/ (HIGH confidence)
- **SQD Logger Reference:** https://docs.sqd.dev/sdk/reference/logger/ (HIGH confidence)
- **SQD Self-Hosting Guide:** https://docs.sqd.dev/sdk/resources/self-hosting/ (HIGH confidence)
- **SQD Portal Migration Guide:** https://docs.sqd.dev/migrate-to-portal-sdk/ (HIGH confidence)
- **SQD Portal Real-Time Migration:** https://docs.sqd.dev/migrate-to-portal-with-real-time-data-on-evm/ (HIGH confidence)
- **SQD Cloud Deployment:** https://docs.sqd.dev/cloud/overview/ (HIGH confidence)
- **SQD External APIs & IPFS:** https://docs.sqd.dev/sdk/resources/external-api/ (HIGH confidence)
- **Codebase analysis:** Direct reading of package.json, pnpm-lock.yaml, source files (HIGH confidence)

---

_Researched: 2026-02-06_
