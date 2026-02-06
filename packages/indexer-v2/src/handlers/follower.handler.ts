/**
 * Follower entity handler.
 *
 * Subscribes to both Follow and Unfollow entity bags. For Follow events,
 * creates derived `Follower` entities with deterministic IDs matching V1's
 * `generateFollowId` format ("{followerAddress} - {followedAddress}").
 * For Unfollow events, queues deletion of `Follower` entities.
 *
 * Key behaviors:
 * - Follow → `batchCtx.addEntity()` with deterministic ID from `generateFollowId`
 * - Unfollow → `batchCtx.queueDelete()` with minimal Follower instances (just ID)
 * - CRITICAL: Unfollow uses `unfollow.unfollowedAddress` (not `followedAddress`)
 *   when generating the ID for deletion
 * - FKs set to null, enrichment queued for both follower and followed UP FKs
 * - No direct `store.*` calls — follows V2 pipeline conventions
 *
 * Port from v1:
 *   - handlers/followerSystemHandler.ts
 */
import { EntityCategory } from '@/core/types';
import { generateFollowId } from '@/utils';
import { Follow, Follower, Unfollow } from '@chillwhales/typeorm';

import type { EntityHandler, HandlerContext } from '@/core/types';

const FOLLOWER_TYPE = 'Follower';

const FollowerHandler: EntityHandler = {
  name: 'follower',
  listensToBag: ['Follow', 'Unfollow'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    // Handle Follow events → create Follower entities
    if (triggeredBy === 'Follow') {
      const follows = hctx.batchCtx.getEntities<Follow>('Follow');

      for (const follow of follows.values()) {
        const id = generateFollowId({
          followerAddress: follow.followerAddress,
          followedAddress: follow.followedAddress,
        });

        const entity = new Follower({
          id,
          timestamp: follow.timestamp,
          blockNumber: follow.blockNumber,
          logIndex: follow.logIndex,
          transactionIndex: follow.transactionIndex,
          address: follow.address,
          followerAddress: follow.followerAddress,
          followedAddress: follow.followedAddress,
          followerUniversalProfile: null,
          followedUniversalProfile: null,
        });

        hctx.batchCtx.addEntity(FOLLOWER_TYPE, entity.id, entity);

        // Queue enrichment for both UP FKs on the Follower entity
        hctx.batchCtx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: follow.followerAddress,
          entityType: FOLLOWER_TYPE,
          entityId: entity.id,
          fkField: 'followerUniversalProfile',
        });
        hctx.batchCtx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: follow.followedAddress,
          entityType: FOLLOWER_TYPE,
          entityId: entity.id,
          fkField: 'followedUniversalProfile',
        });
      }
    }

    // Handle Unfollow events → delete Follower entities
    if (triggeredBy === 'Unfollow') {
      const unfollows = hctx.batchCtx.getEntities<Unfollow>('Unfollow');
      const entitiesToDelete: Follower[] = [];

      for (const unfollow of unfollows.values()) {
        // CRITICAL: Use unfollowedAddress (NOT followedAddress) for ID generation
        const id = generateFollowId({
          followerAddress: unfollow.followerAddress,
          followedAddress: unfollow.unfollowedAddress,
        });
        entitiesToDelete.push(new Follower({ id }));
      }

      if (entitiesToDelete.length > 0) {
        hctx.batchCtx.queueDelete({
          entityClass: Follower,
          entities: entitiesToDelete,
        });
      }
    }
  },
};

export default FollowerHandler;
