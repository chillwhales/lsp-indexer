import { FETCH_BATCH_SIZE, FETCH_LIMIT, FETCH_RETRY_COUNT } from '@/constants';
import { Context } from '@/types';
import * as Utils from '@/utils';
import {
  DigitalAsset,
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataCategory,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
  LSP4MetadataRank,
  LSP4MetadataScore,
  NFT,
} from '@chillwhales/typeorm';
import { In, IsNull, LessThan, Like, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export async function lsp4MetadataHandler({
  context,
  populatedLsp4MetadataEntities,
  populatedLsp4MetadataBaseUriEntities,
  validDigitalAssets,
}: {
  context: Context;
  populatedLsp4MetadataEntities: LSP4Metadata[];
  populatedLsp4MetadataBaseUriEntities: LSP4Metadata[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  const digitalAssetsToUpdate = new Map(
    populatedLsp4MetadataEntities
      .filter(({ id, address, digitalAsset }) => id === address && digitalAsset)
      .map(({ id, digitalAsset }) => [
        digitalAsset.id,
        new DigitalAsset({
          ...validDigitalAssets.get(digitalAsset.id)!,
          lsp4Metadata: new LSP4Metadata({ id }),
        }),
      ]),
  );
  if (digitalAssetsToUpdate.size) {
    context.log.info(
      JSON.stringify({
        message: "Saving populated 'DigitalAsset' entities with found 'LSP4Metadata' entities",
        digitalAssetsToUpdateCount: digitalAssetsToUpdate.size,
      }),
    );

    await context.store.upsert([...digitalAssetsToUpdate.values()]);
  }

  const foundNfts = [...populatedLsp4MetadataEntities, ...populatedLsp4MetadataBaseUriEntities]
    .filter(({ nft }) => nft)
    .map(({ nft }) => nft);
  if (foundNfts.length) {
    const knownNfts: Map<string, NFT> = await context.store
      .findBy(NFT, {
        address: In([...new Set(foundNfts.map(({ address }) => address))]),
      })
      .then((nfts) => new Map(nfts.map((nft) => [nft.id, nft])));

    const nftsToUpdate = new Map<string, NFT>();

    for (const lsp4MetadataEntity of [
      ...populatedLsp4MetadataEntities,
      ...populatedLsp4MetadataBaseUriEntities,
    ].filter(({ nft }) => nft && knownNfts.has(nft.id))) {
      const { id, nft } = lsp4MetadataEntity;

      if (nftsToUpdate.has(nft.id)) {
        nftsToUpdate.set(
          nft.id,
          new NFT({
            ...nftsToUpdate.get(nft.id),
            ...(lsp4MetadataEntity.id.startsWith('BaseURI - ')
              ? { lsp4MetadataBaseUri: new LSP4Metadata({ id }) }
              : { lsp4Metadata: new LSP4Metadata({ id }) }),
          }),
        );
      } else {
        nftsToUpdate.set(
          nft.id,
          new NFT({
            ...knownNfts.get(nft.id),
            ...(lsp4MetadataEntity.id.startsWith('BaseURI - ')
              ? { lsp4MetadataBaseUri: new LSP4Metadata({ id }) }
              : { lsp4Metadata: new LSP4Metadata({ id }) }),
          }),
        );
      }
    }

    context.log.info(
      JSON.stringify({
        message: "Saving populated 'NFT' entities with found 'LSP4Metadata' entities",
        nftsToUpdateCount: nftsToUpdate.size,
      }),
    );

    await context.store.upsert([...nftsToUpdate.values()]);
  }

  const lsp4MetadataEntitesWithInvalidUrl = await context.store.findBy(LSP4Metadata, {
    url: Like('%undefined%'),
    nft: { formattedTokenId: Not(IsNull()) },
  });
  if (lsp4MetadataEntitesWithInvalidUrl.length) {
    context.log.info({
      message: "Fixing 'LSP4Metadata' entities with invalid URLs, ending in 'undefined'",
      lsp4MetadataEntitesCount: lsp4MetadataEntitesWithInvalidUrl.length,
    });

    const updatedLsp4MetadataEntities: LSP4Metadata[] = [];

    const nfts = new Map(
      await context.store
        .findBy(NFT, {
          id: In(
            lsp4MetadataEntitesWithInvalidUrl.map(({ address, tokenId }) =>
              Utils.generateTokenId({ address, tokenId }),
            ),
          ),
        })
        .then((nfts) => nfts.map((nft) => [nft.id, nft])),
    );

    for (const lsp4Metadata of lsp4MetadataEntitesWithInvalidUrl) {
      const { address, tokenId, url } = lsp4Metadata;

      if (url.endsWith('undefined')) {
        updatedLsp4MetadataEntities.push(
          new LSP4Metadata({
            ...lsp4Metadata,
            url: url.replace(
              'undefined',
              nfts.get(Utils.generateTokenId({ address, tokenId })).formattedTokenId,
            ),
            isDataFetched: false,
            fetchErrorMessage: null,
            fetchErrorCode: null,
            fetchErrorStatus: null,
            retryCount: 0,
          }),
        );
      }
    }

    await context.store.upsert(updatedLsp4MetadataEntities);
  }

  if (context.isHead) {
    const unfetchedLsp4Metadatas: LSP4Metadata[] = [];
    unfetchedLsp4Metadatas.push(
      ...(await context.store.find(LSP4Metadata, {
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
    unfetchedLsp4Metadatas.push(
      ...(await context.store.find(LSP4Metadata, {
        take: FETCH_LIMIT - unfetchedLsp4Metadatas.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
    unfetchedLsp4Metadatas.push(
      ...(await context.store.find(LSP4Metadata, {
        take: FETCH_LIMIT - unfetchedLsp4Metadatas.length,
        where: {
          url: Not(IsNull()),
          isDataFetched: false,
          fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
          retryCount: LessThan(FETCH_RETRY_COUNT),
        },
      })),
    );
    if (unfetchedLsp4Metadatas.length > 0) {
      context.log.info(
        JSON.stringify({
          message: "'LSP4Metadata' entities found with unfetched data",
          unfetchedLsp4MetadatasCount: unfetchedLsp4Metadatas.length,
        }),
      );

      const updatedLsp4Metadatas: LSP4Metadata[] = [];

      const lsp4MetadataName: LSP4MetadataName[] = [];
      const lsp4MetadataDescription: LSP4MetadataDescription[] = [];
      const lsp4MetadataCategory: LSP4MetadataCategory[] = [];
      const lsp4MetadataLinks: LSP4MetadataLink[] = [];
      const lsp4MetadataImages: LSP4MetadataImage[] = [];
      const lsp4MetadataIcons: LSP4MetadataIcon[] = [];
      const lsp4MetadataAssets: LSP4MetadataAsset[] = [];
      const lsp4MetadataAttributes: LSP4MetadataAttribute[] = [];

      const batchesCount =
        unfetchedLsp4Metadatas.length % FETCH_BATCH_SIZE
          ? Math.floor(unfetchedLsp4Metadatas.length / FETCH_BATCH_SIZE) + 1
          : unfetchedLsp4Metadatas.length / FETCH_BATCH_SIZE;

      for (let index = 0; index < batchesCount; index++) {
        const currentBatch = unfetchedLsp4Metadatas.slice(
          index * FETCH_BATCH_SIZE,
          (index + 1) * FETCH_BATCH_SIZE,
        );
        context.log.info(
          JSON.stringify({
            message: `Processing batch ${index + 1}/${batchesCount} of 'LSP4Metadata' entities with unfetched data`,
          }),
        );

        for (const lsp4Metadata of currentBatch) {
          Utils.DataChanged.LSP4Metadata.extractSubEntities(lsp4Metadata).then((result) => {
            if ('fetchErrorMessage' in result) {
              const { fetchErrorMessage, fetchErrorCode, fetchErrorStatus } = result;

              updatedLsp4Metadatas.push(
                new LSP4Metadata({
                  ...lsp4Metadata,
                  fetchErrorMessage,
                  fetchErrorCode,
                  fetchErrorStatus,
                  retryCount: lsp4Metadata.retryCount + 1,
                }),
              );
            } else {
              updatedLsp4Metadatas.push(
                new LSP4Metadata({
                  ...lsp4Metadata,
                  isDataFetched: true,
                  fetchErrorMessage: null,
                  fetchErrorCode: null,
                  fetchErrorStatus: null,
                  retryCount: null,
                }),
              );

              lsp4MetadataName.push(result.lsp4MetadataName);
              lsp4MetadataDescription.push(result.lsp4MetadataDescription);
              lsp4MetadataCategory.push(result.lsp4MetadataCategory);
              lsp4MetadataLinks.push(...result.lsp4MetadataLinks);
              lsp4MetadataImages.push(...result.lsp4MetadataImages);
              lsp4MetadataIcons.push(...result.lsp4MetadataIcons);
              lsp4MetadataAssets.push(...result.lsp4MetadataAssets);
              lsp4MetadataAttributes.push(...result.lsp4MetadataAttributes);
            }
          });
        }

        while (
          updatedLsp4Metadatas.length <
          (index + 1 === batchesCount
            ? unfetchedLsp4Metadatas.length
            : (index + 1) * FETCH_BATCH_SIZE)
        ) {
          await Utils.timeout(1000);
        }
      }

      context.log.info(
        JSON.stringify({
          message: "Saving fetched 'LSP4Metadata' related entities",
          lsp4MetadataNameCount: lsp4MetadataName.length,
          lsp4MetadataDescriptionCount: lsp4MetadataDescription.length,
          lsp4MetadataCategoryCount: lsp4MetadataCategory.length,
          lsp4MetadataLinksCount: lsp4MetadataLinks.length,
          lsp4MetadataImagesCount: lsp4MetadataImages.length,
          lsp4MetadataIconsCount: lsp4MetadataIcons.length,
          lsp4MetadataAssetsCount: lsp4MetadataAssets.length,
          lsp4MetadataAttributesCount: lsp4MetadataAttributes.length,
        }),
      );

      await Promise.all([
        context.store.upsert(updatedLsp4Metadatas),
        context.store.insert(lsp4MetadataName),
        context.store.insert(lsp4MetadataDescription),
        context.store.insert(lsp4MetadataCategory),
        context.store.insert(lsp4MetadataLinks),
        context.store.insert(lsp4MetadataImages),
        context.store.insert(lsp4MetadataIcons),
        context.store.insert(lsp4MetadataAssets),
        context.store.insert(lsp4MetadataAttributes),
        context.store.insert(
          lsp4MetadataAttributes
            .filter(({ key, value }) => key === 'Score' && Utils.isNumeric(value))
            .map(
              ({ value, lsp4Metadata }) =>
                new LSP4MetadataScore({
                  id: uuidv4(),
                  lsp4Metadata,
                  value: parseInt(value),
                }),
            ),
        ),
        context.store.insert(
          lsp4MetadataAttributes
            .filter(({ key, value }) => key === 'Rank' && Utils.isNumeric(value))
            .map(
              ({ value, lsp4Metadata }) =>
                new LSP4MetadataRank({
                  id: uuidv4(),
                  lsp4Metadata,
                  value: parseInt(value),
                }),
            ),
        ),
      ]);
    }
  }
}
