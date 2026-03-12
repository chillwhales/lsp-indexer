/**
 * Follow (LSP26) event plugin.
 *
 * Handles the `Follow(address,address)` event emitted by the LSP26
 * FollowerSystem singleton contract.
 *
 * Contract-scoped: only processes logs from the LSP26 contract address
 * starting at block 3179471.
 *
 * Creates the raw `Follow` entity for every Follow event (append-only event log).
 *
 * Both follower and followed addresses are queued for verification as
 * UniversalProfiles. FK resolution happens in the enrichment phase (Step 6).
 *
 * `Follower` current-state entity updates are implemented by the FollowerHandler
 * EntityHandler.
 */
import { LSP26_ADDRESS } from '@/constants';
import {
  EntityCategory,
  type Block,
  type EventPlugin,
  type IBatchContext,
  type Log,
} from '@/core/types';
import { LSP26FollowerSystem } from '@chillwhales/abi';
import { Follow } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'Follow';

const FollowPlugin: EventPlugin = {
  name: 'follow',
  topic0: LSP26FollowerSystem.events.Follow.topic,
  contractFilter: { address: LSP26_ADDRESS, fromBlock: 3179471 },
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // EXTRACT
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
      followerUniversalProfile: null,
      followedUniversalProfile: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for both followerUniversalProfile and followedUniversalProfile FKs
    ctx.queueEnrichment<Follow>({
      category: EntityCategory.UniversalProfile,
      address: follower,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'followerUniversalProfile',
      blockNumber: height,
      transactionIndex,
      logIndex,
      timestamp,
    });
    ctx.queueEnrichment<Follow>({
      category: EntityCategory.UniversalProfile,
      address: addr,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'followedUniversalProfile',
      blockNumber: height,
      transactionIndex,
      logIndex,
      timestamp,
    });
  },
};

export default FollowPlugin;
