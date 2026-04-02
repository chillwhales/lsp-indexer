---
estimated_steps: 23
estimated_files: 18
skills_used: []
---

# T02: Add supportedChains to plugin/handler interfaces and all implementations, update deterministic ID helpers

## Description

Add `supportedChains` to EventPlugin and EntityHandler interfaces. Update all 11 plugins and 29 handlers to declare which chains they support. Create the network-prefixed ID helper. Update all deterministic ID generation to use the network prefix. UUID-based IDs stay as-is (per D015).

## Steps

1. Add `readonly supportedChains: string[]` to `EventPlugin` interface in `packages/indexer/src/core/types/plugins.ts`.

2. Add `readonly supportedChains: string[]` to `EntityHandler` interface in `packages/indexer/src/core/types/handler.ts`.

3. Create `prefixId(network: string, id: string): string` helper in `packages/indexer/src/utils/index.ts` that returns `${network}:${id}`. Also update `generateTokenId` to accept optional `network` param: `generateTokenId({ network, address, tokenId })` → `${network}:${address} - ${tokenId}` when network is provided, or legacy format without. Similarly update `generateFollowId` to accept optional `network`.

4. Update all 11 EventPlugin files in `packages/indexer/src/plugins/events/` to add `supportedChains: ['lukso', 'lukso-testnet']` (all standard LSP events apply to all LUKSO chains). The follow.plugin.ts and unfollow.plugin.ts use LSP26_ADDRESS which is LUKSO-specific — for now still declare both chains since the address will come from ChainConfig in T03.

5. Update all 25 generic EntityHandler files in `packages/indexer/src/handlers/` to add `supportedChains: ['lukso', 'lukso-testnet']`.

6. Update all 4 ChillWhales handlers in `packages/indexer/src/handlers/chillwhales/` to add `supportedChains: ['lukso']` only (per D013).

7. This task does NOT need to make the code compile — the `network` field assignments on entities and the processor factory wiring happen in T03. The interface and declaration changes are purely additive.

## Must-Haves

- [ ] EventPlugin interface has supportedChains field
- [ ] EntityHandler interface has supportedChains field
- [ ] All 11 plugins declare supportedChains
- [ ] All 29 handlers declare supportedChains
- [ ] ChillWhales handlers are lukso-only (D013)
- [ ] prefixId helper exists in utils
- [ ] generateTokenId and generateFollowId accept optional network param

## Verification

- `grep -rl 'supportedChains' packages/indexer/src/plugins/events/ | wc -l` returns 11
- `grep -rl 'supportedChains' packages/indexer/src/handlers/ | wc -l` returns 29
- `grep -c "supportedChains: \['lukso'\]" packages/indexer/src/handlers/chillwhales/*.handler.ts` returns 4
- `grep -q 'prefixId' packages/indexer/src/utils/index.ts`

## Inputs

- ``packages/indexer/src/core/types/plugins.ts` — EventPlugin interface to extend`
- ``packages/indexer/src/core/types/handler.ts` — EntityHandler interface to extend`
- ``packages/indexer/src/utils/index.ts` — existing generateTokenId/generateFollowId helpers`
- ``packages/indexer/src/plugins/events/*.plugin.ts` — 11 plugin files to add supportedChains`
- ``packages/indexer/src/handlers/*.handler.ts` — 25 generic handler files`
- ``packages/indexer/src/handlers/chillwhales/*.handler.ts` — 4 ChillWhales-specific handlers`
- ``packages/indexer/src/config/chainConfig.ts` — chain IDs to reference for supportedChains values`

## Expected Output

- ``packages/indexer/src/core/types/plugins.ts` — EventPlugin with supportedChains field`
- ``packages/indexer/src/core/types/handler.ts` — EntityHandler with supportedChains field`
- ``packages/indexer/src/utils/index.ts` — prefixId(), updated generateTokenId(), updated generateFollowId()`
- ``packages/indexer/src/plugins/events/*.plugin.ts` — all 11 plugins with supportedChains`
- ``packages/indexer/src/handlers/*.handler.ts` — all 25 handlers with supportedChains`
- ``packages/indexer/src/handlers/chillwhales/*.handler.ts` — 4 handlers with supportedChains: ['lukso']`

## Verification

grep -rl 'supportedChains' packages/indexer/src/plugins/events/ | wc -l | grep -q 11 && grep -rl 'supportedChains' packages/indexer/src/handlers/ | wc -l | grep -q 29 && grep -q 'prefixId' packages/indexer/src/utils/index.ts
