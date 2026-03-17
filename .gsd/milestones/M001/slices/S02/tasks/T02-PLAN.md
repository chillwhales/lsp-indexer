# T02: 02-new-handlers-structured-logging 02

**Slice:** S02 — **Milestone:** M001

## Description

Build the Follower EntityHandler and TypeScript sources for Follow/Unfollow EventPlugins.

Purpose: HNDL-01 requires Follow events to create Follower entities with deterministic IDs. HNDL-02 requires Unfollow events to remove Follower entities via queueDelete. The EventPlugins already exist as compiled JS but need TypeScript source files for Phase 1's TypeScript migration. The Follower handler is entirely new.

Output: `follower.handler.ts` implementing EntityHandler with `listensToBag: ['Follow', 'Unfollow']`, TypeScript source files for both EventPlugins, and unit tests proving the follow/unfollow cycle with deterministic ID generation.

## Must-Haves

- [ ] 'Follow events produce Follower entities with deterministic IDs matching V1 format (followerAddress - followedAddress)'
- [ ] 'Unfollow events queue deletion of Follower entities using the correct unfollowedAddress field'
- [ ] 'EventPlugins create raw Follow/Unfollow entities with uuid IDs and queue UP enrichment'
- [ ] 'Follower handler queues UP enrichment for both follower and followed addresses'

## Files

- `packages/indexer-v2/src/handlers/follower.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts`
- `packages/indexer-v2/src/plugins/events/follow.plugin.ts`
- `packages/indexer-v2/src/plugins/events/unfollow.plugin.ts`
