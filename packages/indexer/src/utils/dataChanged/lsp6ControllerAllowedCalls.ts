import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import {
  LSP6AllowedCall,
  LSP6ControllerAllowedCalls,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { decodeValueType } from '@erc725/erc725.js';
import { bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): {
  lsp6ControllerAllowedCalls: LSP6ControllerAllowedCalls;
  lsp6AllowedCallEntities: LSP6AllowedCall[];
} {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  try {
    const lsp6ControllerAllowedCalls = new LSP6ControllerAllowedCalls({
      id: `${address} - ${dataKey}`,
      timestamp: new Date(timestamp),
      address,
      controllerAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
      rawValue: dataValue,
    });

    const allowedCalls: Hex[] = decodeValueType('bytes[CompactBytesArray]', dataValue);

    const lsp6AllowedCallEntities = allowedCalls.map(
      (allowedCall, index) =>
        new LSP6AllowedCall({
          id: `${address} - ${dataKey} - ${index}`,
          restrictionOperations: bytesToHex(hexToBytes(allowedCall as Hex).slice(0, 4)),
          allowedAddress: bytesToHex(hexToBytes(allowedCall as Hex).slice(4, 24)),
          allowedInterfaceId: bytesToHex(hexToBytes(allowedCall as Hex).slice(24, 28)),
          allowedFunction: bytesToHex(hexToBytes(allowedCall as Hex).slice(28)),
          lsp6ControllerAllowedCalls,
        }),
    );

    return {
      lsp6ControllerAllowedCalls,
      lsp6AllowedCallEntities,
    };
  } catch {
    return {
      lsp6ControllerAllowedCalls: new LSP6ControllerAllowedCalls({
        id: `${address} - ${dataKey}`,
        timestamp: new Date(timestamp),
        address,
        controllerAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
        rawValue: dataValue,
      }),
      lsp6AllowedCallEntities: [],
    };
  }
}

export function populate({
  lsp6ControllerAllowedCallsEntities,
  validUniversalProfiles,
}: {
  lsp6ControllerAllowedCallsEntities: LSP6ControllerAllowedCalls[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp6ControllerAllowedCallsEntities.map(
    (entity) =>
      new LSP6ControllerAllowedCalls({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
