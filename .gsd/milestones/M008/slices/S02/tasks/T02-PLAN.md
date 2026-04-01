---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T02: Verify full workspace parity and zero stale references

Run comprehensive verification to confirm the workspace is clean: no stale references remain anywhere, the correct 6 packages exist, and builds pass.

## Steps

1. Confirm deleted: `ls packages/abi packages/typeorm` should fail (not exist)
2. Confirm package count: `ls packages/` should show exactly 6 directories: comparison-tool, indexer, next, node, react, types
3. Grep entire repo for stale refs: `rg '@chillwhales/abi|@chillwhales/typeorm' --type ts --type json --type yaml -l | grep -v node_modules | grep -v .gsd/` must return zero matches
4. Confirm indexer build: `pnpm --filter=@chillwhales/indexer build` exits 0
5. Confirm full workspace build: `pnpm build` exits 0

## Must-Haves

- [ ] packages/abi/ does not exist
- [ ] packages/typeorm/ does not exist
- [ ] Zero grep matches for stale package references
- [ ] 6 packages in packages/ directory
- [ ] Full workspace build passes

## Inputs

- ``packages/indexer/test/integration/pipeline.test.ts` — should have updated import from T01`
- ``eslint.config.ts` — should have updated comment from T01`
- ``pnpm-lock.yaml` — should be updated from T01`

## Expected Output

- ``packages/` — confirmed to contain exactly 6 subdirectories`

## Verification

rg '@chillwhales/abi|@chillwhales/typeorm' --type ts --type json --type yaml -l | grep -v node_modules | grep -v .gsd/ | wc -l | grep -q '^0$' && test $(ls -d packages/*/ | wc -l) -eq 6
