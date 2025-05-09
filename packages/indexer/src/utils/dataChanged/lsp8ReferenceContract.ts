import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP8ReferenceContract } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';
import { isHex } from 'viem';

export function extract({ block, log }: ExtractParams): LSP8ReferenceContract {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8ReferenceContract({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    value: !isHex(dataValue) || dataValue === '0x' ? null : dataValue,
  });
}

export function populate({
  lsp8ReferenceContracts,
  validDigitalAssets,
}: {
  lsp8ReferenceContracts: LSP8ReferenceContract[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp8ReferenceContracts.map(
    (event) =>
      new LSP8ReferenceContract({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}
