import { DigitalAsset, LSP8TokenIdFormatEnum, NFT } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { isHex } from 'viem';
import { formatTokenId } from '.';

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
  return entities.map((entity) => {
    const digitalAsset = validDigitalAssets.get(entity.address);

    let lsp8TokenIdFormat = LSP8TokenIdFormatEnum.NUMBER;
    if (
      digitalAsset &&
      digitalAsset.lsp8TokenIdFormat &&
      digitalAsset.lsp8TokenIdFormat.length > 0
    ) {
      const latestLsp8TokenIdFormat = digitalAsset.lsp8TokenIdFormat.sort(
        (a, b) => b.timestamp.valueOf() - a.timestamp.valueOf(),
      )[0];

      if (latestLsp8TokenIdFormat.value) {
        lsp8TokenIdFormat = latestLsp8TokenIdFormat.value;
      }
    }

    return new NFT({
      ...entity,
      formattedTokenId: isHex(entity.tokenId)
        ? formatTokenId({ tokenId: entity.tokenId, lsp8TokenIdFormat })
        : null,
      digitalAsset: digitalAsset ? new DigitalAsset({ id: entity.address }) : null,
    });
  });
}
