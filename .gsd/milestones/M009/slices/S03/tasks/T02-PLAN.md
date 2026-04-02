---
estimated_steps: 17
estimated_files: 2
skills_used: []
---

# T02: Verify Docker build and compose config validation

Build the Docker image to prove all Dockerfile changes compile, and validate the full docker-compose config resolves correctly.

## Steps

1. **Validate compose config:** Run `cd docker && docker compose --env-file ../.env.example config` to verify YAML syntax and env interpolation. The command may warn about required vars like HASURA_GRAPHQL_ADMIN_SECRET being unset — that's expected. The key check is no YAML parse errors.

2. **Create a minimal .env for build:** Create a temporary `.env.build` with just the required vars for config validation: `HASURA_GRAPHQL_ADMIN_SECRET=test-secret-for-build`. Run `cd docker && docker compose --env-file ../.env.build config > /dev/null` to verify clean parse.

3. **Build the Docker image:** Run `cd docker && docker compose --env-file ../.env.build build indexer` to verify the Dockerfile compiles. This confirms postgresql-client installs and SQL files copy correctly. If the build environment lacks Docker daemon access, verify with `docker build -f docker/Dockerfile .` or document the limitation.

4. **Verify both services exist in config:** Run `cd docker && docker compose --env-file ../.env.build config --services` and confirm both `indexer` and `indexer-testnet` appear.

5. **Verify CHAIN_ID in rendered config:** Run `cd docker && docker compose --env-file ../.env.build config` and grep for `CHAIN_ID: lukso` (mainnet) and `CHAIN_ID: lukso-testnet` (testnet) in the output.

6. **Clean up:** Remove the temporary `.env.build` file.

## Must-Haves

- [ ] `docker compose config` parses without YAML errors
- [ ] Both `indexer` and `indexer-testnet` services appear in `--services` output
- [ ] CHAIN_ID values are correct for both services in rendered config
- [ ] Docker build completes (or is documented as requiring Docker daemon)

## Verification

- `cd docker && docker compose --env-file ../.env.build config --services | sort` outputs `indexer` and `indexer-testnet` (among others)
- `cd docker && docker compose --env-file ../.env.build config | grep -c 'CHAIN_ID'` returns >= 2
- Docker build exit code 0 (or documented limitation)

## Inputs

- ``docker/Dockerfile` — fixed Dockerfile from T01`
- ``docker/entrypoint.sh` — updated entrypoint from T01`
- ``docker/docker-compose.yml` — updated compose from T01`
- ``.env.example` — updated env template from T01`

## Expected Output

- ``docker/docker-compose.yml` — validated (no changes expected, but may need minor fixes if config validation reveals issues)`

## Verification

cd docker && echo 'HASURA_GRAPHQL_ADMIN_SECRET=test' > ../.env.build && docker compose --env-file ../.env.build config --services | grep -q 'indexer-testnet' && docker compose --env-file ../.env.build config | grep -c 'CHAIN_ID' | grep -q '[2-9]' && rm -f ../.env.build && echo 'Config validation passed'
