# M008: Package Consolidation

**Gathered:** 2026-04-01
**Status:** Ready for planning

## Project Description

Merge the `@chillwhales/abi` and `@chillwhales/typeorm` packages into `@chillwhales/indexer`. Both packages are pure codegen (ABI typegen and TypeORM entity codegen) consumed exclusively by the indexer. The split adds build complexity and cross-package wiring with no benefit.

## Why This Milestone

The indexer is about to gain multi-chain support (M009, M010). Every schema change, ABI addition, or entity modification currently requires coordinating across 3 packages with separate build steps. Consolidating first means multi-chain changes are atomic within one package.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Run `pnpm --filter=@chillwhales/indexer build` and get ABI codegen, entity codegen, and indexer compilation in one step
- See a cleaner monorepo with 5 packages instead of 7 (indexer, types, node, react, next + comparison-tool)

### Entry point / environment

- Entry point: `pnpm build` from monorepo root
- Environment: local dev
- Live dependencies involved: none (structural refactor only)

## Completion Class

- Contract complete means: `pnpm build` succeeds, zero imports of old package names, old package dirs deleted
- Integration complete means: indexer starts and the 6-step pipeline processes blocks correctly
- Operational complete means: none — no runtime behavior change

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- `pnpm build` from monorepo root succeeds with zero errors
- No file in the repo imports from `@chillwhales/abi` or `@chillwhales/typeorm`
- `packages/abi/` and `packages/typeorm/` directories no longer exist
- The indexer builds and starts successfully (dry-run or against LUKSO RPC)

## Risks and Unknowns

- Codegen scripts (`squid-evm-typegen`, `squid-typeorm-codegen`) may have implicit assumptions about working directory or output paths — needs verification during S01
- `pnpm-workspace.yaml` and root `package.json` references to old packages must be cleaned up
- Hasura codegen commands in typeorm package.json (`hasura:generate`, `hasura:apply`) need a new home

## Existing Codebase / Prior Art

- `packages/abi/scripts/codegen.sh` — ABI typegen script, generates `src/abi/*.ts` and barrel `src/index.ts`
- `packages/abi/` — only consumed by `packages/indexer/` (zero external imports)
- `packages/typeorm/schema.graphql` — 51 entity types, source of truth for TypeORM entities
- `packages/typeorm/` — only consumed by `packages/indexer/` (zero external imports)
- `packages/indexer/src/constants/index.ts` — hardcoded LUKSO constants (will change in M009)
- `docker/Dockerfile` — may reference old package paths in build steps

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R027 — Package consolidation (primary)
- R036 — LUKSO parity constraint (cross-cutting)

## Scope

### In Scope

- Move `packages/abi/` contents into `packages/indexer/` (codegen script, custom ABIs, ABI dependencies)
- Move `packages/typeorm/schema.graphql` and codegen config into `packages/indexer/`
- Move Hasura generation/apply commands into indexer package.json
- Rewrite all `@chillwhales/abi` imports to local paths within indexer
- Rewrite all `@chillwhales/typeorm` imports to local paths within indexer
- Update `pnpm-workspace.yaml` to remove old packages
- Update root `package.json` if it references old packages
- Update `docker/Dockerfile` if it references old package paths
- Delete `packages/abi/` and `packages/typeorm/` directories

### Out of Scope / Non-Goals

- Changing any indexer runtime behavior
- Modifying entity schemas
- Adding multi-chain support (that's M009)
- Touching consumer packages (types, node, react, next)

## Technical Constraints

- `squid-evm-typegen` reads ABI JSON files and outputs TypeScript — output path must be configured correctly
- `squid-typeorm-codegen` reads `schema.graphql` and outputs model classes — must find the schema in the new location
- The generated model classes must end up importable as before (internal to indexer now)
- Existing tests in `packages/indexer/src/handlers/__tests__/` import from `@chillwhales/typeorm` and must be updated

## Integration Points

- `pnpm-workspace.yaml` — package list
- `docker/Dockerfile` — build steps
- `docker/manage.sh` — if it references package names

## Open Questions

- None — straightforward structural refactor with clear verification criteria
