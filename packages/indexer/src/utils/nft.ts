import { DigitalAsset, NFT } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';

interface CustomParams {
  context: DataHandlerContext<Store, {}>;
  nfts: Map<string, NFT>;
}

export async function verify({ context, nfts }: CustomParams): Promise<NFT[]> {
  const nftsArray = [...nfts.values()];

  const transferNfts = nftsArray.filter(({ isBurned, isMinted }) => isBurned || isMinted);
  const dataChangedNfts = nftsArray.filter(({ isBurned, isMinted }) => !isBurned && !isMinted);

  if (dataChangedNfts.length === 0) return transferNfts;

  const knownNfts: Map<string, NFT> = await context.store
    .findBy(NFT, { id: In(dataChangedNfts) })
    .then((ts) => new Map(ts.map((t) => [t.id, t])));

  return [...transferNfts, ...dataChangedNfts.filter(({ id }) => !knownNfts.has(id))];
}

export function populate({
  entities,
  unverifiedDigitalAssets,
}: {
  entities: NFT[];
  unverifiedDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map(
    (entity) =>
      new NFT({
        ...entity,
        digitalAsset: !unverifiedDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
      }),
  );
}
