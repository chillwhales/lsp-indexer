import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { DigitalAsset, LSP8ReferenceContract } from '@chillwhales/typeorm';
import { isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP8ReferenceContract {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8ReferenceContract({
    id: address,
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : dataValue,
    rawValue: dataValue,
  });
}

export function populate({
  lsp8ReferenceContractEntities,
  validDigitalAssets,
}: {
  lsp8ReferenceContractEntities: LSP8ReferenceContract[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp8ReferenceContractEntities.map(
    (event) =>
      new LSP8ReferenceContract({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
