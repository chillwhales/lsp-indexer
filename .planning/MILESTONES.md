# Milestones: LSP Indexer

## v1.1 — React Hooks Package

**Shipped:** 2026-03-08
**Phases:** 33 (Phase 7–16) | **Plans:** 77 | **Requirements:** 46/46

**Delivered:** 4 publishable npm packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) providing type-safe access to all 12 LUKSO indexer query domains — with TanStack Query hooks, graphql-ws subscriptions, Next.js server actions, Prisma-style include type narrowing, and full CI/CD pipeline.

**Key accomplishments:**

1. Shipped 4 publishable packages with ESM+CJS+DTS builds, `"use client"` directives, and zero publish errors
2. Built 12 query domain verticals end-to-end — each with Zod types, GraphQL documents, parsers, services, hooks, and server actions
3. Implemented real-time WebSocket subscriptions for all 12 domains with automatic TanStack Query cache invalidation
4. Created Prisma-style conditional include type narrowing — `include` parameter narrows TypeScript return types so excluded fields are absent from autocomplete
5. Migrated to shared ecosystem packages (`@chillwhales/erc725`, `@chillwhales/lsp1`) and cleaned up v1 indexer code entirely
6. Built CI/CD pipeline with changesets versioning, preview releases, and shared reusable workflows in `chillwhales/.github`

**Archives:** `milestones/v1.1-ROADMAP.md`, `milestones/v1.1-REQUIREMENTS.md`
**Audit:** `milestones/v1.1-MILESTONE-AUDIT.md` (PASSED — 30/30 requirements, 33/33 phases, 5/5 E2E flows)

---

## v1.0 — LSP Indexer V2 Rewrite

**Shipped:** 2026-02-16
**Phases:** 11 (Phase 1–6) | **Plans:** 36 | **Requirements:** 45/45

**Delivered:** Complete V2 rewrite of the LUKSO blockchain event indexer — 29 EntityHandlers, 11 EventPlugins, 3 metadata fetch handlers, structured logging, queue-based worker pool, and automated V1/V2 comparison tool with data parity validated.

**Archives:** `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`

---

_Last updated: 2026-03-08 — v1.1 shipped_
