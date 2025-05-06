import { LSP0ERC725Account } from '@chillwhales/sqd-abi';
import { UniversalProfile, UniversalReceiver } from '@chillwhales/sqd-typeorm';
import { ExtractParams } from './types';

export function extractUniversalReceiver({ block, log }: ExtractParams): UniversalReceiver {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
  const { from, value, typeId, receivedData, returnedValue } =
    LSP0ERC725Account.events.UniversalReceiver.decode(log);

  return new UniversalReceiver({
    id: log.id,
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    address,
    from,
    value,
    typeId,
    receivedData,
    returnedValue,
    universalProfile: new UniversalProfile({ id: address, address }),
  });
}
