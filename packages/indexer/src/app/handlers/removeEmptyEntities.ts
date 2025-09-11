import { Context } from '@/types';
import {
  LSP12IssuedAssetsItem,
  LSP12IssuedAssetsMap,
  LSP4CreatorsItem,
  LSP4CreatorsMap,
  LSP5ReceivedAssetsItem,
  LSP5ReceivedAssetsMap,
} from '@chillwhales/typeorm';
import { IsNull } from 'typeorm';

export async function removeEmptyEntities({ context }: { context: Context }) {
  const [
    lsp4CreatorsItemEntities,
    lsp4CreatorsMapEntities,
    lsp5ReceivedAssetsItemEntities,
    lsp5ReceivedAssetsMapEntities,
    lsp12IssuedAssetsItemEntities,
    lsp12IssuedAssetsMapEntities,
  ] = await Promise.all([
    // LSP4Creators[]
    context.store.findBy(LSP4CreatorsItem, { creatorAddress: IsNull() }),
    // LSP4CreatorsMap
    context.store.findBy(LSP4CreatorsMap, { creatorIndex: IsNull(), creatorInterfaceId: IsNull() }),
    // LSP5ReceivedAssets[]
    context.store.findBy(LSP5ReceivedAssetsItem, { receivedAssetAddress: IsNull() }),
    // LSP5ReceivedAssetsMap
    context.store.findBy(LSP5ReceivedAssetsMap, {
      receivedAssetIndex: IsNull(),
      receivedAssetInterfaceId: IsNull(),
    }),
    // LSP12IssuedAssets[]
    context.store.findBy(LSP12IssuedAssetsItem, { issuedAssetAddress: IsNull() }),
    // LSP12IssuedAssetsMap
    context.store.findBy(LSP12IssuedAssetsMap, {
      issuedAssetIndex: IsNull(),
      issuedAssetInterfaceId: IsNull(),
    }),
  ]);

  if (
    lsp4CreatorsItemEntities.length ||
    lsp4CreatorsMapEntities.length ||
    lsp5ReceivedAssetsItemEntities.length ||
    lsp5ReceivedAssetsMapEntities.length ||
    lsp12IssuedAssetsItemEntities.length ||
    lsp12IssuedAssetsMapEntities.length
  ) {
    context.log.info(
      JSON.stringify({
        message: 'Removing empty entities.',
        ...(lsp4CreatorsItemEntities.length && {
          LSP4CreatorsItemEntities: lsp4CreatorsItemEntities.length,
        }),
        ...(lsp4CreatorsMapEntities.length && {
          LSP4CreatorsMapEntities: lsp4CreatorsMapEntities.length,
        }),
        ...(lsp5ReceivedAssetsItemEntities.length && {
          LSP5ReceivedAssetsItemEntities: lsp5ReceivedAssetsItemEntities.length,
        }),
        ...(lsp5ReceivedAssetsMapEntities.length && {
          LSP5ReceivedAssetsMapEntities: lsp5ReceivedAssetsMapEntities.length,
        }),
        ...(lsp12IssuedAssetsItemEntities.length && {
          LSP12IssuedAssetsItemEntities: lsp12IssuedAssetsItemEntities.length,
        }),
        ...(lsp12IssuedAssetsMapEntities.length && {
          LSP12IssuedAssetsMapEntities: lsp12IssuedAssetsMapEntities.length,
        }),
      }),
    );

    await Promise.all([
      context.store.remove(lsp4CreatorsItemEntities),
      context.store.remove(lsp4CreatorsMapEntities),
      context.store.remove(lsp5ReceivedAssetsItemEntities),
      context.store.remove(lsp5ReceivedAssetsMapEntities),
      context.store.remove(lsp12IssuedAssetsItemEntities),
      context.store.remove(lsp12IssuedAssetsMapEntities),
    ]);
  }
}
