import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP8TokenMetadataBaseURI } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';
import { hexToString, isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP8TokenMetadataBaseURI {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8TokenMetadataBaseURI({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : hexToString(`0x${dataValue.slice(10)}`),
  });
}

export function populate({
  lsp8TokenMetadataBaseUris,
  validDigitalAssets,
}: {
  lsp8TokenMetadataBaseUris: LSP8TokenMetadataBaseURI[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp8TokenMetadataBaseUris.map(
    (event) =>
      new LSP8TokenMetadataBaseURI({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
