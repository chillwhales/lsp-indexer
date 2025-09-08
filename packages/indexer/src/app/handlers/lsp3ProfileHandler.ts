import { FETCH_BATCH_SIZE, FETCH_LIMIT, FETCH_RETRY_COUNT } from '@/constants';
import { Context } from '@/types';
import * as Utils from '@/utils';
import {
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { In, IsNull, LessThan, Not } from 'typeorm';

export async function lsp3ProfileHandler({
  context,
  populatedLsp3ProfileEntities,
  validUniversalProfiles,
}: {
  context: Context;
  populatedLsp3ProfileEntities: LSP3Profile[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  const universalProfilesToUpdate = new Map(
    populatedLsp3ProfileEntities
      .filter(({ universalProfile }) => universalProfile)
      .map(({ id, universalProfile }) => [
        universalProfile.id,
        new UniversalProfile({
          ...validUniversalProfiles.get(universalProfile.id)!,
          lsp3Profile: new LSP3Profile({ id }),
        }),
      ]),
  );
  if (universalProfilesToUpdate.size) {
    context.log.info(
      JSON.stringify({
        message: "Saving populated 'UniversalProfile' entities with found 'LSP3Profile' entities",
        universalProfilesToUpdateCount: universalProfilesToUpdate.size,
      }),
    );

    await context.store.upsert([...universalProfilesToUpdate.values()]);
  }

  if (context.isHead) {
    const unfetchedLsp3Profiles: LSP3Profile[] = [];
    unfetchedLsp3Profiles.push(
      ...(await context.store.find(LSP3Profile, {
        take: FETCH_LIMIT,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: IsNull(),
          fetchErrorMessage: IsNull(),
          fetchErrorStatus: IsNull(),
        },
      })),
    );
    unfetchedLsp3Profiles.push(
      ...(await context.store.find(LSP3Profile, {
        take: FETCH_LIMIT - unfetchedLsp3Profiles.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
    unfetchedLsp3Profiles.push(
      ...(await context.store.find(LSP3Profile, {
        take: FETCH_LIMIT - unfetchedLsp3Profiles.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
    if (unfetchedLsp3Profiles.length > 0) {
      context.log.info(
        JSON.stringify({
          message: "'LSP3Profile' entities found with unfetched data",
          unfetchedLsp3ProfilesCount: unfetchedLsp3Profiles.length,
        }),
      );

      const updatedLsp3Profiles: LSP3Profile[] = [];

      const lsp3ProfileNames: LSP3ProfileName[] = [];
      const lsp3ProfileDescriptions: LSP3ProfileDescription[] = [];
      const lsp3ProfileTags: LSP3ProfileTag[] = [];
      const lsp3ProfileLinks: LSP3ProfileLink[] = [];
      const lsp3ProfileAssets: LSP3ProfileAsset[] = [];
      const lsp3ProfileImages: LSP3ProfileImage[] = [];
      const lsp3ProfileBackgroundImages: LSP3ProfileBackgroundImage[] = [];

      const batchesCount =
        unfetchedLsp3Profiles.length % FETCH_BATCH_SIZE
          ? Math.floor(unfetchedLsp3Profiles.length / FETCH_BATCH_SIZE) + 1
          : unfetchedLsp3Profiles.length / FETCH_BATCH_SIZE;

      for (let index = 0; index < batchesCount; index++) {
        const currentBatch = unfetchedLsp3Profiles.slice(
          index * FETCH_BATCH_SIZE,
          (index + 1) * FETCH_BATCH_SIZE,
        );
        context.log.info(
          JSON.stringify({
            message: `Processing batch ${index + 1}/${batchesCount} of 'LSP3Profile' entities with unfetched data`,
          }),
        );

        for (const lsp3Profile of currentBatch) {
          Utils.DataChanged.LSP3Profile.extractSubEntities(lsp3Profile).then((result) => {
            if ('fetchErrorMessage' in result) {
              const { fetchErrorMessage, fetchErrorCode, fetchErrorStatus } = result;
              updatedLsp3Profiles.push(
                new LSP3Profile({
                  ...lsp3Profile,
                  fetchErrorMessage,
                  fetchErrorCode,
                  fetchErrorStatus,
                  retryCount: lsp3Profile.retryCount + 1,
                }),
              );
            } else {
              updatedLsp3Profiles.push(
                new LSP3Profile({
                  ...lsp3Profile,
                  isDataFetched: true,
                  fetchErrorMessage: null,
                  fetchErrorCode: null,
                  fetchErrorStatus: null,
                  retryCount: null,
                }),
              );

              lsp3ProfileNames.push(result.lsp3ProfileName);
              lsp3ProfileDescriptions.push(result.lsp3ProfileDescription);
              lsp3ProfileTags.push(...result.lsp3ProfileTags);
              lsp3ProfileLinks.push(...result.lsp3ProfileLinks);
              lsp3ProfileAssets.push(...result.lsp3ProfileAssets);
              lsp3ProfileImages.push(...result.lsp3ProfileImages);
              lsp3ProfileBackgroundImages.push(...result.lsp3ProfileBackgroundImages);
            }
          });
        }

        while (
          updatedLsp3Profiles.length <
          (index + 1 === batchesCount
            ? unfetchedLsp3Profiles.length
            : (index + 1) * FETCH_BATCH_SIZE)
        ) {
          await Utils.timeout(1000);
        }
      }

      context.log.info(
        JSON.stringify({
          message: "Saving fetched 'LSP3Profile' related entities",
          lsp3ProfileNamesCount: lsp3ProfileNames.length,
          lsp3ProfileDescriptionsCount: lsp3ProfileDescriptions.length,
          lsp3ProfileTagsCount: lsp3ProfileTags.length,
          lsp3ProfileLinksCount: lsp3ProfileLinks.length,
          lsp3ProfileAssetsCount: lsp3ProfileAssets.length,
          lsp3ProfileImagesCount: lsp3ProfileImages.length,
          lsp3ProfileBackgroundImagesCount: lsp3ProfileBackgroundImages.length,
        }),
      );

      await Promise.all([
        context.store.upsert(updatedLsp3Profiles),
        context.store.insert(lsp3ProfileNames),
        context.store.insert(lsp3ProfileDescriptions),
        context.store.insert(lsp3ProfileTags),
        context.store.insert(lsp3ProfileLinks),
        context.store.insert(lsp3ProfileAssets),
        context.store.insert(lsp3ProfileImages),
        context.store.insert(lsp3ProfileBackgroundImages),
      ]);
    }
  }
}
