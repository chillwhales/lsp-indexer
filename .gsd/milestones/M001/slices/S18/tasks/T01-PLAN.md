# T01: 14-code-comments-cleanup-release-prep 01

**Slice:** S18 — **Milestone:** M001

## Description

Remove all dead/stale comments from the 4 publishable packages and verify+enhance JSDoc coverage on every public API export — ensuring IDE hover shows concise, consumer-oriented documentation.

Purpose: Packages must have clean, professional documentation before npm publish. Dead comments (.planning refs, TODOs) are embarrassing in published code. Missing JSDoc means consumers can't discover API behavior via IDE hover.

Output: All 4 publishable packages (types, node, react, next) have zero dead comments and complete JSDoc on every exported symbol.

## Must-Haves

- [ ] 'Zero comments in publishable packages reference .planning, PLAN, TODO, FIXME, or contain stale implementation notes'
- [ ] 'Developer can hover over any exported function, type, class, or constant in @lsp-indexer/types and see JSDoc'
- [ ] 'Developer can hover over any exported function in @lsp-indexer/node (services, parsers, keys, client, errors, subscriptions) and see JSDoc with @param and @returns'
- [ ] 'Developer can hover over any exported hook in @lsp-indexer/react and see JSDoc with @param, @returns, and @example'
- [ ] 'Developer can hover over any exported server action or hook in @lsp-indexer/next and see JSDoc'

## Files

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
