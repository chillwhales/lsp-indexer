import { ERC725X } from '@chillwhales/sqd-abi';
import { Executed, UniversalProfile } from '@chillwhales/sqd-typeorm';
import { decodeOperationType } from '../utils';
import { ExtractParams } from './types';

export function extractExecuted({ block, log }: ExtractParams): Executed {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
  const { operationType, value, target, selector } = ERC725X.events.Executed.decode(log);

  return new Executed({
    id: log.id,
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    address,
    decodedOperationType: decodeOperationType(operationType),
    operationType,
    value,
    target,
    selector,
    universalProfile: new UniversalProfile({ id: address, address }),
  });
}
