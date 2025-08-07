import { FieldSelection } from '@/app/processor';
import * as Utils from '@/utils';
import { LSP3ProfileUrl } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

export async function extractFromUrl({
  context,
  populatedLsp3ProfileUrls,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedLsp3ProfileUrls: LSP3ProfileUrl[];
}) {
  const extractedEntitesPromise: ReturnType<typeof Utils.createLsp3Profile>[] = [];
  for (const lsp3ProfileUrl of populatedLsp3ProfileUrls) {
    extractedEntitesPromise.push(Utils.createLsp3Profile(lsp3ProfileUrl));
  }
  const extractedEntites = await Promise.all(extractedEntitesPromise);

  const lsp3Profiles = extractedEntites.map(({ lsp3Profile }) => lsp3Profile);
  const lsp3Links = extractedEntites.flatMap(({ lsp3Links }) => lsp3Links);
  const lsp3Assets = extractedEntites.flatMap(({ lsp3Assets }) => lsp3Assets);
  const lsp3ProfileImages = extractedEntites.flatMap(({ lsp3ProfileImages }) => lsp3ProfileImages);
  const lsp3BackgroundImages = extractedEntites.flatMap(
    ({ lsp3BackgroundImages }) => lsp3BackgroundImages,
  );

  context.log.info(
    JSON.stringify({
      message: 'Saving new LSP3Profile objects.',
      lsp3ProfilesCount: lsp3Profiles.length,
      lsp3LinksCount: lsp3Links.length,
      lsp3AssetsCount: lsp3Assets.length,
      lsp3ProfileImagesCount: lsp3ProfileImages.length,
      lsp3BackgroundImagesCount: lsp3BackgroundImages.length,
    }),
  );

  return {
    lsp3Profiles,
    lsp3Links,
    lsp3Assets,
    lsp3ProfileImages,
    lsp3BackgroundImages,
  };
}
