# M008: 

## Vision
Merge @chillwhales/abi and @chillwhales/typeorm into @chillwhales/indexer — one package, one build step, zero cross-package wiring for the indexer.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Merge abi + typeorm into indexer | high | — | ✅ | pnpm --filter=@chillwhales/indexer build runs ABI codegen, entity codegen, and TypeScript compilation in one step — all imports resolve internally |
| S02 | Remove old packages and verify parity | medium | S01 | ⬜ | packages/abi/ and packages/typeorm/ deleted, pnpm build succeeds from root, indexer starts and processes blocks identically |
