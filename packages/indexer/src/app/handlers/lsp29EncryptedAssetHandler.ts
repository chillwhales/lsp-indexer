import { FETCH_BATCH_SIZE, FETCH_LIMIT, FETCH_RETRY_COUNT } from '@/constants';
import { Context } from '@/types';
import * as Utils from '@/utils';
import {
  LSP29AccessControlCondition,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetEncryption,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetImage,
  LSP29EncryptedAssetTitle,
} from '@chillwhales/typeorm';
import { In, IsNull, LessThan, Not } from 'typeorm';

export async function lsp29EncryptedAssetHandler({
  context,
  populatedLsp29EncryptedAssetEntities,
}: {
  context: Context;
  populatedLsp29EncryptedAssetEntities: LSP29EncryptedAsset[];
}) {
  // Filter out entities without valid universal profiles
  const validEntities = populatedLsp29EncryptedAssetEntities.filter(
    (entity) => entity.universalProfile,
  );

  if (validEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Saving populated 'LSP29EncryptedAsset' entities",
        count: validEntities.length,
      }),
    );
  }

  // Fetch JSON metadata when at head of chain
  if (context.isHead) {
    const unfetchedEntities: LSP29EncryptedAsset[] = [];

    // Fetch entities that have never been fetched
    unfetchedEntities.push(
      ...(await context.store.find(LSP29EncryptedAsset, {
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

    // Fetch entities with retryable HTTP errors
    unfetchedEntities.push(
      ...(await context.store.find(LSP29EncryptedAsset, {
        take: FETCH_LIMIT - unfetchedEntities.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );

    // Fetch entities with retryable network errors
    unfetchedEntities.push(
      ...(await context.store.find(LSP29EncryptedAsset, {
        take: FETCH_LIMIT - unfetchedEntities.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );

    if (unfetchedEntities.length > 0) {
      context.log.info(
        JSON.stringify({
          message: "'LSP29EncryptedAsset' entities found with unfetched data",
          unfetchedCount: unfetchedEntities.length,
        }),
      );

      const updatedEntities: LSP29EncryptedAsset[] = [];

      const titles: LSP29EncryptedAssetTitle[] = [];
      const descriptions: LSP29EncryptedAssetDescription[] = [];
      const files: LSP29EncryptedAssetFile[] = [];
      const encryptions: LSP29EncryptedAssetEncryption[] = [];
      const accessControlConditions: LSP29AccessControlCondition[] = [];
      const chunks: LSP29EncryptedAssetChunks[] = [];
      const images: LSP29EncryptedAssetImage[] = [];

      const batchesCount =
        unfetchedEntities.length % FETCH_BATCH_SIZE
          ? Math.floor(unfetchedEntities.length / FETCH_BATCH_SIZE) + 1
          : unfetchedEntities.length / FETCH_BATCH_SIZE;

      for (let index = 0; index < batchesCount; index++) {
        const currentBatch = unfetchedEntities.slice(
          index * FETCH_BATCH_SIZE,
          (index + 1) * FETCH_BATCH_SIZE,
        );

        context.log.info(
          JSON.stringify({
            message: `Processing batch ${index + 1}/${batchesCount} of 'LSP29EncryptedAsset' entities with unfetched data`,
          }),
        );

        for (const entity of currentBatch) {
          Utils.DataChanged.LSP29EncryptedAsset.extractSubEntities(entity).then((result) => {
            if ('fetchErrorMessage' in result) {
              const { fetchErrorMessage, fetchErrorCode, fetchErrorStatus } = result;

              updatedEntities.push(
                new LSP29EncryptedAsset({
                  ...entity,
                  fetchErrorMessage,
                  fetchErrorCode,
                  fetchErrorStatus,
                  retryCount: (entity.retryCount || 0) + 1,
                }),
              );
            } else {
              updatedEntities.push(
                new LSP29EncryptedAsset({
                  ...entity,
                  version: result.version,
                  contentId: result.contentId,
                  revision: result.revision,
                  createdAt: result.createdAt,
                  isDataFetched: true,
                  fetchErrorMessage: null,
                  fetchErrorCode: null,
                  fetchErrorStatus: null,
                  retryCount: null,
                }),
              );

              if (result.lsp29EncryptedAssetTitle) {
                titles.push(result.lsp29EncryptedAssetTitle);
              }
              if (result.lsp29EncryptedAssetDescription) {
                descriptions.push(result.lsp29EncryptedAssetDescription);
              }
              if (result.lsp29EncryptedAssetFile) {
                files.push(result.lsp29EncryptedAssetFile);
              }
              if (result.lsp29EncryptedAssetEncryption) {
                encryptions.push(result.lsp29EncryptedAssetEncryption);
              }
              if (result.lsp29AccessControlConditions) {
                accessControlConditions.push(...result.lsp29AccessControlConditions);
              }
              if (result.lsp29EncryptedAssetChunks) {
                chunks.push(result.lsp29EncryptedAssetChunks);
              }
              if (result.lsp29EncryptedAssetImages) {
                images.push(...result.lsp29EncryptedAssetImages);
              }
            }
          });
        }

        // Wait for batch completion
        while (
          updatedEntities.length <
          (index + 1 === batchesCount ? unfetchedEntities.length : (index + 1) * FETCH_BATCH_SIZE)
        ) {
          await Utils.timeout(1000);
        }
      }

      context.log.info(
        JSON.stringify({
          message: "Saving fetched 'LSP29EncryptedAsset' related entities",
          titlesCount: titles.length,
          descriptionsCount: descriptions.length,
          filesCount: files.length,
          encryptionsCount: encryptions.length,
          accessControlConditionsCount: accessControlConditions.length,
          chunksCount: chunks.length,
          imagesCount: images.length,
        }),
      );

      await Promise.all([
        context.store.upsert(updatedEntities),
        context.store.insert(titles),
        context.store.insert(descriptions),
        context.store.insert(files),
        context.store.insert(encryptions),
        context.store.insert(accessControlConditions),
        context.store.insert(chunks),
        context.store.insert(images),
      ]);
    }
  }
}
