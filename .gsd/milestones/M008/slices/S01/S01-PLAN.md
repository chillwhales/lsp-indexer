# S01: Merge abi + typeorm into indexer

**Goal:** Move all codegen scripts, source files, dependencies, and schema into the indexer package. Rewrite all imports.
**Demo:** After this: pnpm --filter=@chillwhales/indexer build runs ABI codegen, entity codegen, and TypeScript compilation in one step — all imports resolve internally

## Tasks
