/**
 * Follow (LSP26) event plugin.
 *
 * Handles the `Follow(address,address)` event emitted by the LSP26
 * FollowerSystem singleton contract.
 *
 * Contract-scoped: only processes logs from the LSP26 contract address
 * starting at block 3179471.
 *
 * Dual persistence model:
 *   1. `Follow` — Raw event log (UUID id) — append-only via store.insert()
 *   2. `Follower` — Current follow state (deterministic id) — upserted via
 *      handle() so the relationship table stays up-to-date
 *
 * Port from v1:
 *   - scanner.ts L473-480 (event matching)
 *   - utils/follow/index.ts (extract + populate)
 *   - handlers/followerSystemHandler.ts (identifiable follow upsert)
 */
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
import { LSP26FollowerSystem } from '@chillwhales/abi';
import { Follow, Follower, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'Follow';

const FollowPlugin: EventPlugin = {
  name: 'follow',
  topic0: LSP26FollowerSystem.events.Follow.topic,
  contractFilter: { address: LSP26_ADDRESS, fromBlock: 3179471 },
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { follower, addr } = LSP26FollowerSystem.events.Follow.decode(log);

    const entity = new Follow({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      followerAddress: follower,
      followedAddress: addr,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Both follower and followed are UP candidates
    ctx.trackAddress(EntityCategory.UniversalProfile, follower);
    ctx.trackAddress(EntityCategory.UniversalProfile, addr);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    const entities = ctx.getEntities<Follow>(ENTITY_TYPE);

    for (const [, entity] of entities) {
      if (ctx.isValid(EntityCategory.UniversalProfile, entity.followerAddress)) {
        entity.followerUniversalProfile = new UniversalProfile({ id: entity.followerAddress });
      }
      if (ctx.isValid(EntityCategory.UniversalProfile, entity.followedAddress)) {
        entity.followedUniversalProfile = new UniversalProfile({ id: entity.followedAddress });
      }
      // Note: we keep the entity even if one or both UPs are unverified —
      // the FK fields will be null, matching v1 behavior
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await insertEntities(store, ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 5: HANDLE — Upsert current follow state
  // ---------------------------------------------------------------------------

  async handle(hctx: HandlerContext): Promise<void> {
    const entities = hctx.batchCtx.getEntities<Follow>(ENTITY_TYPE);
    if (entities.size === 0) return;

    // Build Follower records with deterministic ids for current-state tracking
    const followers = new Map<string, Follower>();

    for (const entity of entities.values()) {
      const id = generateFollowId({
        followerAddress: entity.followerAddress,
        followedAddress: entity.followedAddress,
      });

      followers.set(
        id,
        new Follower({
          id,
          timestamp: entity.timestamp,
          blockNumber: entity.blockNumber,
          logIndex: entity.logIndex,
          transactionIndex: entity.transactionIndex,
          address: entity.address,
          followerAddress: entity.followerAddress,
          followedAddress: entity.followedAddress,
          followerUniversalProfile: entity.followerUniversalProfile,
          followedUniversalProfile: entity.followedUniversalProfile,
        }),
      );
    }

    await hctx.store.upsert([...followers.values()]);
  },
};

export default FollowPlugin;
