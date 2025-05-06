import { ERC725Y } from '@chillwhales/sqd-abi';
import {
  DataChanged,
  DigitalAsset,
  LSP3ProfileUrl,
  LSP4MetadataUrl,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  UniversalProfile,
} from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';
import { hexToNumber, hexToString, isHex } from 'viem';
import { decodeTokenIdFormat, decodeTokenType, decodeVerifiableUri } from '../utils';
import { ExtractParams } from './types';

export function extractDataChanged({ block, log }: ExtractParams): DataChanged {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new DataChanged({
    id: log.id,
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    address,
    dataKey,
    dataValue,
    universalProfile: new UniversalProfile({ id: address, address }),
    digitalAsset: new DigitalAsset({ id: address, address }),
  });
}

export function extractLsp3ProfileUrl({ block, log }: ExtractParams): LSP3ProfileUrl {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP3ProfileUrl({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    universalProfile: new UniversalProfile({ id: address, address }),
    rawBytes: dataValue,
    value,
    decodeError,
  });
}

export function extractLsp4TokenName({ block, log }: ExtractParams): LSP4TokenName {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenName({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    digitalAsset: new DigitalAsset({ id: address, address }),
    value: !isHex(dataValue) || dataValue === '0x' ? null : hexToString(dataValue),
  });
}

export function extractLsp4TokenSymbol({ block, log }: ExtractParams): LSP4TokenSymbol {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenSymbol({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    digitalAsset: new DigitalAsset({ id: address, address }),
    value: !isHex(dataValue) || dataValue === '0x' ? null : hexToString(dataValue),
  });
}

export function extractLsp4TokenType({ block, log }: ExtractParams): LSP4TokenType {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP4TokenType({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    digitalAsset: new DigitalAsset({ id: address, address }),
    value: !isHex(dataValue) || dataValue === '0x' ? null : decodeTokenType(hexToNumber(dataValue)),
  });
}

export function extractLsp4MetadataUrl({ block, log }: ExtractParams): LSP4MetadataUrl {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value, decodeError } = decodeVerifiableUri(dataValue);

  return new LSP4MetadataUrl({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    digitalAsset: new DigitalAsset({ id: address, address }),
    rawBytes: dataValue,
    value,
    decodeError,
  });
}

export function extractLsp8ReferenceContract({ block, log }: ExtractParams): LSP8ReferenceContract {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8ReferenceContract({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    digitalAsset: new DigitalAsset({ id: address, address }),
    value: !isHex(dataValue) || dataValue === '0x' ? null : dataValue,
  });
}

export function extractLsp8TokenIdFormat({ block, log }: ExtractParams): LSP8TokenIdFormat {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);

  return new LSP8TokenIdFormat({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    digitalAsset: new DigitalAsset({ id: address, address }),
    value:
      !isHex(dataValue) || dataValue === '0x' ? null : decodeTokenIdFormat(hexToNumber(dataValue)),
  });
}
