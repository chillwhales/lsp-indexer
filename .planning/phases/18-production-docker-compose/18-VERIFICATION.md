---
phase: 18-production-docker-compose
verified: 2026-03-09T08:15:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 18: Production Docker Compose Verification Report

**Phase Goal:** Anyone can run the full indexer stack in production using the released Docker image
**Verified:** 2026-03-09T08:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Production compose file uses ghcr.io/chillwhales/lsp-indexer image (not build) | ✓ VERIFIED | `image: ghcr.io/chillwhales/lsp-indexer:${INDEXER_VERSION:-latest}` on line 85; no `build:` directive found (grep returns exit 1) |
| 2 | All 4 services present in prod compose: postgres, indexer, hasura, data-connector-agent | ✓ VERIFIED | All 4 service blocks confirmed at top-level under `services:` |
| 3 | Required vars (POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, RPC_URL) fail loudly if missing | ✓ VERIFIED | 8 occurrences of `:?` syntax across compose file — POSTGRES_PASSWORD (×5), HASURA_GRAPHQL_ADMIN_SECRET (×2), RPC_URL (×1); all include descriptive error messages |
| 4 | Dev compose file (docker/docker-compose.yml) is not modified | ✓ VERIFIED | `git diff docker/docker-compose.yml` produces empty output — zero changes |
| 5 | .env.prod.example documents all required and optional variables | ✓ VERIFIED | 3 required vars (POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, RPC_URL) in REQUIRED section with empty values; 16 optional vars in OPTIONAL section with comments |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `docker/docker-compose.prod.yml` | Production compose with released Docker image | ✓ VERIFIED | 249 lines; uses `ghcr.io/chillwhales/lsp-indexer` image; no build directive; 4 services; postgres port not exposed; Hasura console/dev mode default false |
| `docker/.env.prod.example` | Production environment variable template | ✓ VERIFIED | 106 lines; 3 required vars documented; 16 optional vars with comments; generation hints for passwords |
| `docker/README.md` | Updated with production deployment instructions | ✓ VERIFIED | Contains "Production Deployment" section with setup commands; Files section lists docker-compose.prod.yml and .env.prod.example; comparison table (dev vs prod) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `docker/docker-compose.prod.yml` | `ghcr.io/chillwhales/lsp-indexer` | image directive on indexer service | ✓ WIRED | Line 85: `image: ghcr.io/chillwhales/lsp-indexer:${INDEXER_VERSION:-latest}` |
| `docker/docker-compose.prod.yml` | `docker/.env.prod.example` | env var references match template | ✓ WIRED | All 3 required vars (POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, RPC_URL) referenced in compose match template; all optional vars have defaults via `:-` syntax |
| `docker/README.md` | `docker/docker-compose.prod.yml` | Production Deployment section references | ✓ WIRED | README contains 4 `docker compose -f docker-compose.prod.yml` command examples |
| `docker/README.md` | `docker/.env.prod.example` | Setup instructions reference | ✓ WIRED | README includes `cp .env.prod.example ../.env.prod` command |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DOCK-01 | 18-01-PLAN | Production docker-compose pulls `ghcr.io/chillwhales/lsp-indexer:latest` and runs indexer + PostgreSQL + Hasura | ✓ SATISFIED | Prod compose uses ghcr.io image, includes all 4 services (postgres, indexer, hasura, data-connector-agent), proper depends_on chains |
| DOCK-02 | 18-01-PLAN | Local docker-compose (existing) remains the default for development | ✓ SATISFIED | `git diff docker/docker-compose.yml` shows zero changes; dev compose retains `build:` directive, exposed postgres port, console enabled |
| DOCK-03 | 18-01-PLAN | Production compose is configurable via environment variables (RPC URL, DB credentials, Hasura secrets) | ✓ SATISFIED | All required vars use `${VAR:?message}` for fail-loud; all optional vars use `${VAR:-default}` for configurability; INDEXER_VERSION allows pinning image version |

No orphaned requirements found — all DOCK-01, DOCK-02, DOCK-03 are claimed by plan 18-01 and mapped to this phase in REQUIREMENTS.md.

### Production Hardening Verification

| Aspect | Dev Compose | Prod Compose | Status |
|--------|-------------|--------------|--------|
| Indexer source | `build:` from source | `image: ghcr.io/...` | ✓ Correct |
| PostgreSQL port | Exposed (`5432:5432`) | Not exposed (no `ports:` block) | ✓ Correct |
| POSTGRES_PASSWORD | `${...:-postgres}` (default) | `${...:?Set POSTGRES_PASSWORD}` (required) | ✓ Correct |
| RPC_URL | `${...:-https://rpc.lukso...}` (default) | `${...:?Set RPC_URL}` (required) | ✓ Correct |
| Hasura console | `${...:-true}` (enabled) | `${...:-false}` (disabled) | ✓ Correct |
| Hasura dev mode | `${...:-true}` (enabled) | `${...:-false}` (disabled) | ✓ Correct |
| METADATA_DEFAULTS | `${VAR:-json}` (env override) | Hardcoded YAML string | ✓ Correct |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No anti-patterns found | — | — |

No TODO, FIXME, HACK, PLACEHOLDER, or stub patterns found in any of the 3 files.

### Commit Verification

| Commit | Message | Status |
|--------|---------|--------|
| `eeae64e` | feat(18-01): create production compose file and env template | ✓ Verified |
| `8ae3f72` | docs(18-01): add production deployment section to Docker README | ✓ Verified |

### Human Verification Required

### 1. Production Stack Startup

**Test:** Run `cd docker && cp .env.prod.example ../.env.prod`, set required vars, then `docker compose -f docker-compose.prod.yml --env-file ../.env.prod up -d`
**Expected:** All 4 services start successfully; `docker compose ps` shows all healthy
**Why human:** Requires Docker daemon, network access to ghcr.io, and a valid RPC endpoint

### 2. Required Variable Enforcement

**Test:** Run `docker compose -f docker-compose.prod.yml --env-file /dev/null up` without setting required vars
**Expected:** Compose fails immediately with descriptive error messages for POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, and RPC_URL
**Why human:** Requires Docker daemon to test compose variable interpolation

### 3. Hasura API Access

**Test:** After stack is running, access `http://localhost:8080/healthz`
**Expected:** Returns healthy status; console is NOT accessible at `http://localhost:8080/console` by default
**Why human:** Requires running stack and HTTP requests

### Gaps Summary

No gaps found. All 5 observable truths verified. All 3 requirements (DOCK-01, DOCK-02, DOCK-03) satisfied. All artifacts exist, are substantive, and properly wired. No anti-patterns detected.

The production compose file correctly mirrors the dev compose structure while applying all required hardening changes: released image instead of build, no exposed DB port, disabled console/dev mode, and fail-loud required variables.

---

_Verified: 2026-03-09T08:15:00Z_
_Verifier: Claude (gsd-verifier)_
