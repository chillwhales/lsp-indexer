/**
 * Unfollow (LSP26) event plugin.
 *
 * Handles the `Unfollow(address,address)` event emitted by the LSP26
 * FollowerSystem singleton contract.
 *
 * Contract-scoped: only processes logs from the LSP26 contract address
 * starting at block 3179471.
 *
 * Creates the raw `Unfollow` entity for every Unfollow event (append-only event log).
 *
 * Both unfollower and unfollowed addresses are queued for verification as
 * UniversalProfiles. FK resolution happens in the enrichment phase (Step 6).
 *
 * `Follower` current-state entity removal is implemented by the FollowerHandler
 * EntityHandler.
 *
 * Port from v1:
 *   - scanner.ts L482-489 (event matching)
 *   - utils/unfollow/index.ts (extract + populate)
 */
import { LSP26_ADDRESS } from '@/constants';
import { EntityCategory } from '@/core/types';
import { LSP26FollowerSystem } from '@chillwhales/abi';
import { Unfollow } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

import type { Block, EventPlugin, IBatchContext, Log } from '@/core/types';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'Unfollow';

const UnfollowPlugin: EventPlugin = {
  name: 'unfollow',
  topic0: LSP26FollowerSystem.events.Unfollow.topic,
  contractFilter: { address: LSP26_ADDRESS, fromBlock: 3179471 },
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // EXTRACT
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
      followerUniversalProfile: null,
      unfollowedUniversalProfile: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for both followerUniversalProfile and unfollowedUniversalProfile FKs
    ctx.queueEnrichment({
      category: EntityCategory.UniversalProfile,
      address: unfollower,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'followerUniversalProfile',
    });
    ctx.queueEnrichment({
      category: EntityCategory.UniversalProfile,
      address: addr,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'unfollowedUniversalProfile',
    });
  },
};

export default UnfollowPlugin;
