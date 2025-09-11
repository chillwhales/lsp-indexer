import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import {
  LSP6AllowedERC725YDataKey,
  LSP6ControllerAllowedERC725YDataKeys,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { decodeValueType } from '@erc725/erc725.js';
import { bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): {
  lsp6ControllerAllowedErc725YDataKeys: LSP6ControllerAllowedERC725YDataKeys;
  lsp6AllowedErc725YDataKeysEntities: LSP6AllowedERC725YDataKey[];
} {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  try {
    const lsp6ControllerAllowedErc725YDataKeys = new LSP6ControllerAllowedERC725YDataKeys({
      id: `${address} - ${dataKey}`,
      timestamp: new Date(timestamp),
      address,
      controllerAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
      rawValue: dataValue,
    });

    const allowedErc725YDataKeys: Hex[] = decodeValueType('bytes[CompactBytesArray]', dataValue);

    const lsp6AllowedErc725YDataKeysEntities = allowedErc725YDataKeys.map(
      (allowedErc725YDataKey, index) =>
        new LSP6AllowedERC725YDataKey({
          id: `${address} - ${dataKey} - ${index}`,
          allowedDataKey: allowedErc725YDataKey,
          lsp6ControllerAllowedErc725YDataKeys,
        }),
    );

    return {
      lsp6ControllerAllowedErc725YDataKeys,
      lsp6AllowedErc725YDataKeysEntities,
    };
  } catch {
    return {
      lsp6ControllerAllowedErc725YDataKeys: new LSP6ControllerAllowedERC725YDataKeys({
        id: `${address} - ${dataKey}`,
        timestamp: new Date(timestamp),
        address,
        controllerAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
        rawValue: dataValue,
      }),
      lsp6AllowedErc725YDataKeysEntities: [],
    };
  }
}

export function populate({
  lsp6ControllerAllowedErc725YDataKeysEntities,
  validUniversalProfiles,
}: {
  lsp6ControllerAllowedErc725YDataKeysEntities: LSP6ControllerAllowedERC725YDataKeys[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp6ControllerAllowedErc725YDataKeysEntities.map(
    (entity) =>
      new LSP6ControllerAllowedERC725YDataKeys({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
