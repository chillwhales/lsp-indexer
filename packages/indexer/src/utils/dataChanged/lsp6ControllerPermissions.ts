import { ExtractParams } from '@/types';
import { ERC725Y } from '@chillwhales/abi';
import { LSP6ControllerPermissions, LSP6Permission, UniversalProfile } from '@chillwhales/typeorm';
import { decodePermissions } from '@erc725/erc725.js';
import { bytesToHex, Hex, hexToBytes } from 'viem';

export function extract({ block, log }: ExtractParams): {
  lsp6ControllerPermissions: LSP6ControllerPermissions;
  lsp6PermissionEntities: LSP6Permission[];
} {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

  if (hexToBytes(dataValue as Hex).length !== 32) {
    return {
      lsp6ControllerPermissions: new LSP6ControllerPermissions({
        id: `${address} - ${dataKey}`,
        timestamp: new Date(timestamp),
        address,
        controllerAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
        rawValue: dataValue,
      }),
      lsp6PermissionEntities: [],
    };
  }

  const lsp6ControllerPermissions = new LSP6ControllerPermissions({
    id: `${address} - ${dataKey}`,
    timestamp: new Date(timestamp),
    address,
    controllerAddress: bytesToHex(hexToBytes(dataKey as Hex).slice(12)),
    rawValue: dataValue,
  });

  const permissions = decodePermissions(dataValue as Hex);

  const lsp6PermissionEntities = Object.keys(permissions).map(
    (permissionName) =>
      new LSP6Permission({
        id: `${address} - ${dataKey} - ${permissionName}`,
        permissionName,
        permissionValue: permissions[permissionName],
        lsp6ControllerPermissions,
      }),
  );

  return {
    lsp6ControllerPermissions,
    lsp6PermissionEntities,
  };
}

export function populate({
  lsp6ControllerPermissionsEntities,
  validUniversalProfiles,
}: {
  lsp6ControllerPermissionsEntities: LSP6ControllerPermissions[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp6ControllerPermissionsEntities.map(
    (entity) =>
      new LSP6ControllerPermissions({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
