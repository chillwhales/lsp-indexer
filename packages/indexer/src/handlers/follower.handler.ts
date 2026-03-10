/**
 * Follower entity handler.
 *
 * Subscribes to both Follow and Unfollow entity bags. For Follow events,
 * creates derived `Follower` entities with deterministic IDs using
 * `generateFollowId` format ("{followerAddress} - {followedAddress}").
 * For Unfollow events, queues deletion of `Follower` entities.
 *
 * Key behaviors:
 * - Follow → `batchCtx.addEntity()` with deterministic ID from `generateFollowId`
 * - Unfollow → `batchCtx.queueDelete()` with minimal Follower instances (just ID)
 * - CRITICAL: Unfollow uses `unfollow.unfollowedAddress` (not `followedAddress`)
 *   when generating the ID for deletion
 * - FKs set to null, enrichment queued for both follower and followed UP FKs
 * - No direct `store.*` calls — follows pipeline conventions
 */
import { getTypedEntities } from '@/core/entityTypeMap';
import { EntityCategory, type EntityHandler, type HandlerContext } from '@/core/types';
import { generateFollowId } from '@/utils';
import { Follower } from '@chillwhales/typeorm';

const FOLLOWER_TYPE = 'Follower';

const FollowerHandler: EntityHandler = {
  name: 'follower',
  listensToBag: ['Follow', 'Unfollow'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    // Handle Follow events → create Follower entities
    if (triggeredBy === 'Follow') {
      const follows = getTypedEntities(hctx.batchCtx, 'Follow');

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
        hctx.batchCtx.queueEnrichment<Follower>({
          category: EntityCategory.UniversalProfile,
          address: follow.followerAddress,
          entityType: FOLLOWER_TYPE,
          entityId: entity.id,
          fkField: 'followerUniversalProfile',
          blockNumber: follow.blockNumber,
          transactionIndex: follow.transactionIndex,
          logIndex: follow.logIndex,
        });
        hctx.batchCtx.queueEnrichment<Follower>({
          category: EntityCategory.UniversalProfile,
          address: follow.followedAddress,
          entityType: FOLLOWER_TYPE,
          entityId: entity.id,
          fkField: 'followedUniversalProfile',
          blockNumber: follow.blockNumber,
          transactionIndex: follow.transactionIndex,
          logIndex: follow.logIndex,
        });
      }
    }

    // Handle Unfollow events → delete Follower entities
    if (triggeredBy === 'Unfollow') {
      const unfollows = getTypedEntities(hctx.batchCtx, 'Unfollow');
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
