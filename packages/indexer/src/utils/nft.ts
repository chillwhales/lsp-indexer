import { DigitalAsset, NFT } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';

interface VerifyParams {
  context: DataHandlerContext<Store, {}>;
  nfts: Map<string, NFT>;
}

export async function verify({ context, nfts }: VerifyParams): Promise<NFT[]> {
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
  validDigitalAssets,
}: {
  entities: NFT[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return new Map(
    entities.map((entity) => [
      entity.id,
      new NFT({
        ...entity,
        digitalAsset: validDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
      }),
    ]),
  );
}
