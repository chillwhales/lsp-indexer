import { Context } from '@/types';
import * as Utils from '@/utils';
import { Follow, Unfollow } from '@chillwhales/typeorm';

export async function followerSystemHandler({
  context,
  populatedFollowEntities,
  populatedUnfollowEntities,
}: {
  context: Context;
  populatedFollowEntities: Follow[];
  populatedUnfollowEntities: Unfollow[];
}) {
  if (populatedFollowEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Follow events found. Adding new identifiable 'Follow' entities.",
        followsCount: populatedFollowEntities.length,
      }),
    );

    const identifiableFollowsMap = new Map(
      populatedFollowEntities.map((follow) => {
        const id = Utils.generateFollowId({
          followerAddress: follow.followerAddress,
          followedAddress: follow.followedAddress,
        });
        return [
          id,
          new Follow({
            ...follow,
            id,
          }),
        ];
      }),
    );
    await context.store.upsert([...identifiableFollowsMap.values()]);
  }

  if (populatedUnfollowEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Unfollow events found. Removing identifiable 'Follow' entities.",
        unfollowsCount: populatedUnfollowEntities.length,
      }),
    );

    const identifiableUnfollowsMap = new Map(
      populatedUnfollowEntities.map((unfollow) => {
        const id = Utils.generateFollowId({
          followerAddress: unfollow.followerAddress,
          followedAddress: unfollow.unfollowedAddress,
        });
        return [
          id,
          new Unfollow({
            ...unfollow,
            id,
          }),
        ];
      }),
    );
    await context.store.remove([...identifiableUnfollowsMap.values()]);
  }
}
