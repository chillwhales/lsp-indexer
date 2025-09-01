import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP8TokenMetadataBaseURI } from '@chillwhales/sqd-typeorm';
import { concat, hexToString, isHex, keccak256, sliceHex, toHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP8TokenMetadataBaseURI {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8TokenMetadataBaseURI({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value:
      !isHex(dataValue) ||
      dataValue === '0x' ||
      (!dataValue.startsWith(toHex(0, { size: 8 })) &&
        !dataValue.startsWith(
          concat([
            toHex(0, { size: 2 }),
            sliceHex(keccak256(toHex('keccak256(bytes)')), 0, 4),
            toHex(0, { size: 2 }),
          ]),
        ))
        ? null
        : hexToString(sliceHex(dataValue, 8)),
    rawValue: dataValue,
  });
}

export function populate({
  lsp8TokenMetadataBaseUriEntities,
  validDigitalAssets,
}: {
  lsp8TokenMetadataBaseUriEntities: LSP8TokenMetadataBaseURI[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp8TokenMetadataBaseUriEntities.map(
    (event) =>
      new LSP8TokenMetadataBaseURI({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
