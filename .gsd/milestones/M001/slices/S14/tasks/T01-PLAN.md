# T01: 10.1-subscription-foundation 01

**Slice:** S14 — **Milestone:** M001

## Description

Complete type-safety revamp of subscription infrastructure, export where-clause builders from all 12 domain services, and wire the test app for subscription development.

Purpose: This is the foundation that all 12 domain subscription sub-phases (10.2–10.13) build on. The type-safety revamp replaces stringly-typed `SubscriptionConfig<T>` with a fully generic 4-param version so types flow end-to-end from `TypedDocumentString` through `extract` → `parser` → consumer. Subscription documents are NOT created here — each domain sub-phase creates its own per the Phase 10 sub-phase pattern.

Output: Type-safe subscription config with zero `as` casts, 12 exported `buildXWhere` functions, test app wired with `IndexerSubscriptionProvider`, playground skeleton at `/subscriptions`.

## Must-Haves

- [ ] 'SubscriptionConfig uses 4 generic params <TResult, TVariables, TRaw, TParsed> with typed extract function — zero type assertions in entire data path'
- [ ] 'buildXWhere functions are importable from @lsp-indexer/node for all 12 domains'
- [ ] 'IndexerSubscriptionProvider wraps the test app inside QueryClientProvider'
- [ ] 'Subscriptions playground page skeleton exists at /subscriptions'
- [ ] 'All 4 packages + test app build with zero type errors'

## Files

- `packages/node/src/services/profiles.ts`
- `packages/node/src/services/digital-assets.ts`
- `packages/node/src/services/nfts.ts`
- `packages/node/src/services/owned-assets.ts`
- `packages/node/src/services/owned-tokens.ts`
- `packages/node/src/services/followers.ts`
- `packages/node/src/services/creators.ts`
- `packages/node/src/services/issued-assets.ts`
- `packages/node/src/services/encrypted-assets.ts`
- `packages/node/src/services/data-changed-events.ts`
- `packages/node/src/services/token-id-data-changed-events.ts`
- `packages/node/src/services/universal-receiver-events.ts`
- `apps/test/src/app/providers.tsx`
- `apps/test/src/app/subscriptions/page.tsx`
- `apps/test/src/components/nav.tsx`
