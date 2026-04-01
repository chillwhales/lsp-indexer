---
estimated_steps: 20
estimated_files: 3
skills_used: []
---

# T03: Update Docker, entrypoint, and root package.json references

Update all infrastructure files that reference the old `packages/abi/` and `packages/typeorm/` paths to point at `packages/indexer/` instead.

## Steps

1. Update `docker/Dockerfile`:
   - **deps stage:** Remove `COPY packages/abi/package.json` and `COPY packages/typeorm/package.json` lines. Keep only `COPY packages/indexer/package.json`.
   - **builder stage:** Remove `COPY --from=deps .../packages/abi/node_modules` and `packages/typeorm/node_modules` lines. Remove `COPY packages/abi` and `COPY packages/typeorm` source copy lines. Remove `pnpm --filter=@chillwhales/abi build` and `pnpm --filter=@chillwhales/typeorm build` from the RUN chain — only `pnpm --filter=@chillwhales/indexer build` remains.
   - **runner stage:** Remove all `packages/abi/` and `packages/typeorm/` COPY and package.json lines. Add `COPY --from=builder /app/packages/indexer/schema.graphql ./packages/indexer/` (needed for migrations at runtime). Remove the `packages/typeorm/schema.graphql` COPY line.
2. Update `docker/entrypoint.sh`:
   - Change `cd /app/packages/typeorm` to `cd /app/packages/indexer`
3. Update root `package.json`:
   - Change `hasura:generate` from `@chillwhales/typeorm` to `@chillwhales/indexer`
   - Change `hasura:apply` from `@chillwhales/typeorm` to `@chillwhales/indexer`
   - Change `migration:generate` from `@chillwhales/typeorm` to `@chillwhales/indexer`
   - Change `migration:apply` from `@chillwhales/typeorm` to `@chillwhales/indexer`
4. Verify `pnpm --filter=@chillwhales/indexer build` still passes
5. Verify no remaining references to `@chillwhales/typeorm` in `docker/` or root `package.json`

## Must-Haves

- [ ] Dockerfile references only `packages/indexer/` (no abi or typeorm)
- [ ] Entrypoint runs migrations/Hasura from `packages/indexer/`
- [ ] Root package.json delegates migration/Hasura scripts to `@chillwhales/indexer`
- [ ] `pnpm --filter=@chillwhales/indexer build` still exits 0

## Inputs

- `docker/Dockerfile`
- `docker/entrypoint.sh`
- `package.json`
- `packages/indexer/package.json`

## Expected Output

- `docker/Dockerfile`
- `docker/entrypoint.sh`
- `package.json`

## Verification

pnpm --filter=@chillwhales/indexer build && ! rg '@chillwhales/typeorm|packages/typeorm|@chillwhales/abi|packages/abi' docker/ package.json --type-not yaml -q
