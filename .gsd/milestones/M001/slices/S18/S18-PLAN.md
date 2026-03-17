# S18: Code Comments Cleanup Release Prep

**Goal:** Remove all dead/stale comments from the 4 publishable packages and verify+enhance JSDoc coverage on every public API export — ensuring IDE hover shows concise, consumer-oriented documentation.
**Demo:** Remove all dead/stale comments from the 4 publishable packages and verify+enhance JSDoc coverage on every public API export — ensuring IDE hover shows concise, consumer-oriented documentation.

## Must-Haves


## Tasks

- [x] **T01: 14-code-comments-cleanup-release-prep 01** `est:8min`
  - Remove all dead/stale comments from the 4 publishable packages and verify+enhance JSDoc coverage on every public API export — ensuring IDE hover shows concise, consumer-oriented documentation.

Purpose: Packages must have clean, professional documentation before npm publish. Dead comments (.planning refs, TODOs) are embarrassing in published code. Missing JSDoc means consumers can't discover API behavior via IDE hover.

Output: All 4 publishable packages (types, node, react, next) have zero dead comments and complete JSDoc on every exported symbol.
- [x] **T02: 14-code-comments-cleanup-release-prep 02** `est:8min`
  - Add clear, consumer-oriented documentation to every test app page and component, then run final build + publish validation to confirm all 4 packages are ready for npm release.

Purpose: The test app is the primary reference implementation for hook consumers — clear documentation makes the difference between "useful reference" and "opaque demo code." Final validation confirms packages are publish-ready.

Output: Documented test app + validated, publish-ready packages.

## Files Likely Touched

- `packages/types/src/*.ts`
- `packages/node/src/services/*.ts`
- `packages/node/src/parsers/*.ts`
- `packages/node/src/keys/*.ts`
- `packages/node/src/documents/*.ts`
- `packages/node/src/client/*.ts`
- `packages/node/src/errors/*.ts`
- `packages/node/src/subscriptions/*.ts`
- `packages/react/src/hooks/**/*.ts`
- `packages/react/src/subscriptions/*.ts`
- `packages/react/src/subscriptions/*.tsx`
- `packages/react/src/index.ts`
- `packages/react/src/utils.ts`
- `packages/react/src/constants.ts`
- `packages/next/src/actions/*.ts`
- `packages/next/src/hooks/**/*.ts`
- `packages/next/src/subscriptions/*.ts`
- `packages/next/src/server.ts`
- `packages/next/src/index.ts`
- `apps/test/src/app/page.tsx`
- `apps/test/src/app/profiles/page.tsx`
- `apps/test/src/app/digital-assets/page.tsx`
- `apps/test/src/app/nfts/page.tsx`
- `apps/test/src/app/owned-assets/page.tsx`
- `apps/test/src/app/owned-tokens/page.tsx`
- `apps/test/src/app/follows/page.tsx`
- `apps/test/src/app/creators/page.tsx`
- `apps/test/src/app/issued-assets/page.tsx`
- `apps/test/src/app/encrypted-assets/page.tsx`
- `apps/test/src/app/data-changed-events/page.tsx`
- `apps/test/src/app/token-id-data-changed-events/page.tsx`
- `apps/test/src/app/universal-receiver-events/page.tsx`
- `apps/test/src/app/layout.tsx`
- `apps/test/src/app/providers.tsx`
- `apps/test/src/components/profile-card.tsx`
- `apps/test/src/components/digital-asset-card.tsx`
- `apps/test/src/components/nft-card.tsx`
- `apps/test/src/components/owned-asset-card.tsx`
- `apps/test/src/components/owned-token-card.tsx`
- `apps/test/src/components/follower-card.tsx`
- `apps/test/src/components/creator-card.tsx`
- `apps/test/src/components/issued-asset-card.tsx`
- `apps/test/src/components/encrypted-asset-card.tsx`
- `apps/test/src/components/data-changed-event-card.tsx`
- `apps/test/src/components/token-id-data-changed-event-card.tsx`
- `apps/test/src/components/universal-receiver-event-card.tsx`
- `apps/test/src/components/connection-status.tsx`
- `apps/test/src/components/image-list.tsx`
- `apps/test/src/components/expandable-hex.tsx`
- `apps/test/src/components/collapsible-sections.tsx`
- `apps/test/src/components/nav.tsx`
- `apps/test/src/components/playground/filter-fields.tsx`
- `apps/test/src/components/playground/sort-controls.tsx`
- `apps/test/src/components/playground/results-list.tsx`
- `apps/test/src/components/playground/error-alert.tsx`
- `apps/test/src/components/playground/raw-json-toggle.tsx`
