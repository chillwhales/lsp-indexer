/**
 * Unfollow (LSP26) event plugin.
 *
 * Handles the `Unfollow(address,address)` event emitted by the LSP26
 * FollowerSystem singleton contract.
 *
 * Contract-scoped: only processes logs from the LSP26 contract address
 * starting at block 3179471.
 *
 * Dual persistence model:
 *   1. `Unfollow` — Raw event log (UUID id) — append-only via store.insert()
 *   2. `Follower` removal — Removes the corresponding Follower record
 *      (deterministic id) created by the Follow plugin
 *
 * Port from v1:
 *   - scanner.ts L482-489 (event matching)
 *   - utils/unfollow/index.ts (extract + populate)
 *   - handlers/followerSystemHandler.ts (identifiable follow removal)
 */
import { v4 as uuidv4 } from 'uuid';

import { LSP26FollowerSystem } from '@chillwhales/abi';
import { Follower, Unfollow, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { LSP26_ADDRESS } from '@/constants';
import { insertEntities } from '@/core/persistHelpers';
import {
  Block,
  EntityCategory,
  EventPlugin,
  HandlerContext,
  IBatchContext,
  Log,
} from '@/core/types';
import { generateFollowId } from '@/utils';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'Unfollow';

const UnfollowPlugin: EventPlugin = {
  name: 'unfollow',
  topic0: LSP26FollowerSystem.events.Unfollow.topic,
  contractFilter: { address: LSP26_ADDRESS, fromBlock: 3179471 },
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { unfollower, addr } = LSP26FollowerSystem.events.Unfollow.decode(log);

    const entity = new Unfollow({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      followerAddress: unfollower,
      unfollowedAddress: addr,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Both unfollower and unfollowed are UP candidates
    ctx.trackAddress(EntityCategory.UniversalProfile, unfollower);
    ctx.trackAddress(EntityCategory.UniversalProfile, addr);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    const entities = ctx.getEntities<Unfollow>(ENTITY_TYPE);

    for (const [, entity] of entities) {
      if (ctx.isValid(EntityCategory.UniversalProfile, entity.followerAddress)) {
        entity.followerUniversalProfile = new UniversalProfile({ id: entity.followerAddress });
      }
      if (ctx.isValid(EntityCategory.UniversalProfile, entity.unfollowedAddress)) {
        entity.unfollowedUniversalProfile = new UniversalProfile({
          id: entity.unfollowedAddress,
        });
      }
      // Keep entity even if UPs are unverified — FK fields will be null
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await insertEntities(store, ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 5: HANDLE — Remove corresponding Follower records
  // ---------------------------------------------------------------------------

  async handle(hctx: HandlerContext): Promise<void> {
    const entities = hctx.batchCtx.getEntities<Unfollow>(ENTITY_TYPE);
    if (entities.size === 0) return;

    // Collect deterministic Follower IDs to remove
    const followerIds: string[] = [];

    for (const entity of entities.values()) {
      followerIds.push(
        generateFollowId({
          followerAddress: entity.followerAddress,
          followedAddress: entity.unfollowedAddress,
        }),
      );
    }

    await hctx.store.remove(Follower, followerIds);
  },
};

export default UnfollowPlugin;
