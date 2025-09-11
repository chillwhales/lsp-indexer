import { Context } from '@/types';
import {
  LSP6AllowedCall,
  LSP6AllowedERC725YDataKey,
  LSP6ControllerAllowedCalls,
  LSP6ControllerAllowedERC725YDataKeys,
  LSP6ControllerPermissions,
  LSP6Permission,
} from '@chillwhales/typeorm';
import { In } from 'typeorm';

export async function permissionsUpdateHandler({
  context,
  populatedLsp6ControllerPermissionsEntities,
  lsp6PermissionEntities,
  populatedLsp6ControllerAllowedCallsEntities,
  lsp6AllowedCallEntities,
  populatedLsp6ControllerAllowedErc725YDataKeysEntities,
  lsp6AllowedErc725YDataKeyEntities,
}: {
  context: Context;
  populatedLsp6ControllerPermissionsEntities: LSP6ControllerPermissions[];
  lsp6PermissionEntities: Map<string, LSP6Permission>;
  populatedLsp6ControllerAllowedCallsEntities: LSP6ControllerAllowedCalls[];
  lsp6AllowedCallEntities: Map<string, LSP6AllowedCall>;
  populatedLsp6ControllerAllowedErc725YDataKeysEntities: LSP6ControllerAllowedERC725YDataKeys[];
  lsp6AllowedErc725YDataKeyEntities: Map<string, LSP6AllowedERC725YDataKey>;
}) {
  const [
    lsp6PermissionsEntitiesToRemove,
    lsp6AllowedCallsEntitiesToRemove,
    lsp6AllowedErc725YDataKeysEntitiesToRemove,
  ] = await Promise.all([
    // AddressPermissions:Permissions:<address>
    context.store.findBy(LSP6Permission, {
      lsp6ControllerPermissions: {
        id: In(populatedLsp6ControllerPermissionsEntities.map(({ id }) => id)),
      },
    }),
    // AddressPermissions:AllowedCalls:<address>
    context.store.findBy(LSP6AllowedCall, {
      lsp6ControllerAllowedCalls: {
        id: In(populatedLsp6ControllerAllowedCallsEntities.map(({ id }) => id)),
      },
    }),
    // AddressPermissions:AllowedERC725YDataKeys:<address>
    context.store.findBy(LSP6AllowedERC725YDataKey, {
      lsp6ControllerAllowedErc725YDataKeys: {
        id: In(populatedLsp6ControllerAllowedErc725YDataKeysEntities.map(({ id }) => id)),
      },
    }),
  ]);

  if (
    lsp6PermissionsEntitiesToRemove.length ||
    lsp6AllowedCallsEntitiesToRemove.length ||
    lsp6AllowedErc725YDataKeysEntitiesToRemove.length
  ) {
    context.log.info(
      JSON.stringify({
        message: 'Removing old entities.',
        ...(lsp6PermissionsEntitiesToRemove.length && {
          LSP6PermissionsEntitiesCount: lsp6PermissionsEntitiesToRemove.length,
        }),
        ...(lsp6AllowedCallsEntitiesToRemove.length && {
          LSP6AllowedCallsEntitiesCount: lsp6AllowedCallsEntitiesToRemove.length,
        }),
        ...(lsp6AllowedErc725YDataKeysEntitiesToRemove.length && {
          LSP6AllowedERC725YDataKeysEntitiesCount:
            lsp6AllowedErc725YDataKeysEntitiesToRemove.length,
        }),
      }),
    );

    await Promise.all([
      context.store.remove(lsp6PermissionsEntitiesToRemove),
      context.store.remove(lsp6AllowedCallsEntitiesToRemove),
      context.store.remove(lsp6AllowedErc725YDataKeysEntitiesToRemove),
    ]);
  }

  if (
    lsp6PermissionEntities.size ||
    lsp6AllowedCallEntities.size ||
    lsp6AllowedErc725YDataKeyEntities.size
  ) {
    context.log.info(
      JSON.stringify({
        message: 'Inserting new entities.',
        ...(lsp6PermissionEntities.size && {
          LSP6PermissionEntitiesCount: lsp6PermissionEntities.size,
        }),
        ...(lsp6AllowedCallEntities.size && {
          LSP6AllowedCallEntitiesCount: lsp6AllowedCallEntities.size,
        }),
        ...(lsp6AllowedErc725YDataKeyEntities.size && {
          LSP6AllowedERC725YDataKeyEntitiesCount: lsp6AllowedErc725YDataKeyEntities.size,
        }),
      }),
    );

    await Promise.all([
      context.store.insert([...lsp6PermissionEntities.values()]),
      context.store.insert([...lsp6AllowedCallEntities.values()]),
      context.store.insert([...lsp6AllowedErc725YDataKeyEntities.values()]),
    ]);
  }
}
