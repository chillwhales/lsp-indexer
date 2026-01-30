/**
 * LSP6Controllers data key plugin.
 *
 * Handles five related `AddressPermissions` data key patterns emitted via
 * `DataChanged(bytes32,bytes)` on Universal Profiles:
 *
 *   1. **AddressPermissions[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of controllers.
 *      Entity: `LSP6ControllersLength` (deterministic id = address).
 *
 *   2. **AddressPermissions[] index** — prefix match on `0xdf30dba06db6a30e65354d9a64c60986`.
 *      Decodes a controller address from the data value and the array index
 *      from the last 16 bytes of the data key.
 *
 *   3. **AddressPermissions:Permissions** — prefix match on `0x4b80742de2bf82acb3630000`.
 *      Decodes the controller address from the data key (last 20 bytes) and
 *      the raw permissions bitmap from the data value (32 bytes).
 *      Sub-entities: `LSP6Permission` (one per decoded permission flag).
 *
 *   4. **AddressPermissions:AllowedCalls** — prefix match on `0x4b80742de2bf393a64c70000`.
 *      Decodes the controller address from the data key (last 20 bytes) and
 *      a CompactBytesArray of allowed calls from the data value.
 *      Sub-entities: `LSP6AllowedCall` (one per decoded allowed call entry).
 *
 *   5. **AddressPermissions:AllowedERC725YDataKeys** — prefix `0x4b80742de2bf866c29110000`.
 *      Decodes the controller address from the data key (last 20 bytes) and
 *      a CompactBytesArray of allowed data keys from the data value.
 *      Sub-entities: `LSP6AllowedERC725YDataKey` (one per allowed key).
 *
 * Index and Map events (patterns 2-5) all create/update the same merged
 * `LSP6Controller` entity keyed by `"{upAddress} - {controllerAddress}"`.
 * Each source populates different fields; if multiple fire in the same batch,
 * later events merge into the existing entity.
 *
 * controllerAddress is tracked for UniversalProfile verification so the
 * optional `controllerProfile` FK can be populated when the controller is a UP.
 *
 * Sub-entities are cleared before re-inserting (delete-then-reinsert) via
 * `clearSubEntities()` to keep them in sync with raw value changes.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp6ControllersLength.ts
 *   - utils/dataChanged/lsp6ControllersItem.ts
 *   - utils/dataChanged/lsp6ControllerPermissions.ts
 *   - utils/dataChanged/lsp6ControllerAllowedCalls.ts
 *   - utils/dataChanged/lsp6ControllerAllowedErc725DataKey.ts
 *   - app/handlers/permissionsUpdateHandler.ts (clear + insert sub-entities)
 */
import { LSP6DataKeys } from '@lukso/lsp6-contracts';

import {
  LSP6AllowedCall,
  LSP6AllowedERC725YDataKey,
  LSP6Controller,
  LSP6ControllersLength,
  LSP6Permission,
} from '@chillwhales/typeorm';
import { decodePermissions, decodeValueType } from '@erc725/erc725.js';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { bytesToBigInt, bytesToHex, Hex, hexToBigInt, hexToBytes, isHex } from 'viem';

import {
  enrichEntityFk,
  insertEntities,
  mergeUpsertEntities,
  populateByUP,
  upsertEntities,
} from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const LENGTH_TYPE = 'LSP6ControllersLength';
const CONTROLLER_TYPE = 'LSP6Controller';
const PERMISSION_TYPE = 'LSP6Permission';
const ALLOWED_CALL_TYPE = 'LSP6AllowedCall';
const ALLOWED_DATA_KEY_TYPE = 'LSP6AllowedERC725YDataKey';

// ---------------------------------------------------------------------------
// Data key constants
// ---------------------------------------------------------------------------
const LSP6_LENGTH_KEY: string = LSP6DataKeys['AddressPermissions[]'].length;
const LSP6_INDEX_PREFIX: string = LSP6DataKeys['AddressPermissions[]'].index;
const LSP6_PERMISSIONS_PREFIX: string = LSP6DataKeys['AddressPermissions:Permissions'];
const LSP6_ALLOWED_CALLS_PREFIX: string = LSP6DataKeys['AddressPermissions:AllowedCalls'];
const LSP6_ALLOWED_DATA_KEYS_PREFIX: string =
  LSP6DataKeys['AddressPermissions:AllowedERC725YDataKeys'];

const LSP6ControllersPlugin: DataKeyPlugin = {
  name: 'lsp6Controllers',
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return (
      dataKey === LSP6_LENGTH_KEY ||
      dataKey.startsWith(LSP6_INDEX_PREFIX) ||
      dataKey.startsWith(LSP6_PERMISSIONS_PREFIX) ||
      dataKey.startsWith(LSP6_ALLOWED_CALLS_PREFIX) ||
      dataKey.startsWith(LSP6_ALLOWED_DATA_KEYS_PREFIX)
    );
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;

    if (dataKey === LSP6_LENGTH_KEY) {
      extractLength(address, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP6_INDEX_PREFIX)) {
      extractFromIndex(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP6_PERMISSIONS_PREFIX)) {
      extractPermissions(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP6_ALLOWED_CALLS_PREFIX)) {
      extractAllowedCalls(address, dataKey, dataValue, timestamp, ctx);
    } else if (dataKey.startsWith(LSP6_ALLOWED_DATA_KEYS_PREFIX)) {
      extractAllowedDataKeys(address, dataKey, dataValue, timestamp, ctx);
    }

    // UP address tracking is handled by the DataChanged meta-plugin (parent).
    // Controller addresses are tracked here for UP verification (controllerProfile FK).
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByUP<LSP6ControllersLength>(ctx, LENGTH_TYPE);
    populateByUP<LSP6Controller>(ctx, CONTROLLER_TYPE);
    enrichEntityFk(
      ctx,
      CONTROLLER_TYPE,
      EntityCategory.UniversalProfile,
      'controllerAddress',
      'controllerProfile',
    );

    // Link sub-entities to their parent controller
    linkSubEntitiesToController(ctx, PERMISSION_TYPE);
    linkSubEntitiesToController(ctx, ALLOWED_CALL_TYPE);
    linkSubEntitiesToController(ctx, ALLOWED_DATA_KEY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4a: CLEAR SUB-ENTITIES
  // Delete-then-reinsert pattern: remove existing sub-entities for controllers
  // that have new data in this batch, before re-inserting fresh decoded values.
  // ---------------------------------------------------------------------------

  async clearSubEntities(store: Store, ctx: IBatchContext): Promise<void> {
    const controllers = ctx.getEntities<LSP6Controller>(CONTROLLER_TYPE);
    if (controllers.size === 0) return;

    // Only clear sub-entity types that actually had new data in this batch.
    // If only Permissions fired, we must not wipe AllowedCalls/AllowedDataKeys.
    const hasPermissions = ctx.hasEntities(PERMISSION_TYPE);
    const hasAllowedCalls = ctx.hasEntities(ALLOWED_CALL_TYPE);
    const hasAllowedDataKeys = ctx.hasEntities(ALLOWED_DATA_KEY_TYPE);

    if (!hasPermissions && !hasAllowedCalls && !hasAllowedDataKeys) return;

    const ids = [...controllers.keys()];
    const filter = { controller: { id: In(ids) } };

    // Find existing sub-entities only for the types that were touched
    const [permissions, allowedCalls, allowedDataKeys] = await Promise.all([
      hasPermissions ? store.findBy(LSP6Permission, filter) : Promise.resolve([]),
      hasAllowedCalls ? store.findBy(LSP6AllowedCall, filter) : Promise.resolve([]),
      hasAllowedDataKeys ? store.findBy(LSP6AllowedERC725YDataKey, filter) : Promise.resolve([]),
    ]);

    // Remove found sub-entities
    await Promise.all([
      store.remove(permissions),
      store.remove(allowedCalls),
      store.remove(allowedDataKeys),
    ]);
  },

  // ---------------------------------------------------------------------------
  // Phase 4b: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    // Persist main entities first (sub-entities reference controller FK)
    await Promise.all([
      upsertEntities(store, ctx, LENGTH_TYPE),
      mergeUpsertEntities(store, ctx, CONTROLLER_TYPE, LSP6Controller, [
        'arrayIndex',
        'permissionsRawValue',
        'allowedCallsRawValue',
        'allowedDataKeysRawValue',
        'controllerProfile',
      ]),
    ]);

    // Then persist sub-entities (append-only after clear)
    await Promise.all([
      insertEntities(store, ctx, PERMISSION_TYPE),
      insertEntities(store, ctx, ALLOWED_CALL_TYPE),
      insertEntities(store, ctx, ALLOWED_DATA_KEY_TYPE),
    ]);
  },
};

// ---------------------------------------------------------------------------
// Extract helpers
// ---------------------------------------------------------------------------

/**
 * Extract LSP6ControllersLength.
 *
 * dataValue should be 16 bytes (uint128). If not, value is stored as null.
 * Deterministic id = address (one length entity per universal profile).
 */
function extractLength(
  address: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const entity = new LSP6ControllersLength({
    id: address,
    address,
    timestamp: new Date(timestamp),
    value:
      isHex(dataValue) && hexToBytes(dataValue as Hex).length === 16
        ? hexToBigInt(dataValue as Hex)
        : null,
    rawValue: dataValue,
  });

  ctx.addEntity(LENGTH_TYPE, entity.id, entity);
}

/**
 * Extract controller from an AddressPermissions[] index (Item) event.
 *
 * controllerAddress: decoded from dataValue (must be exactly 20 bytes).
 * arrayIndex: last 16 bytes of dataKey converted to BigInt.
 *
 * If dataValue is not a valid 20-byte address, the event is skipped.
 *
 * Merges into existing LSP6Controller entity if one was already created
 * by a Permissions/AllowedCalls/AllowedDataKeys event in the same batch.
 */
function extractFromIndex(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  // Skip if dataValue is not a valid 20-byte address
  if (!isHex(dataValue) || hexToBytes(dataValue as Hex).length !== 20) return;

  // Normalize to lowercase 0x-prefixed via bytesToHex to match the format
  // used by extractPermissions/extractAllowedCalls/extractAllowedDataKeys
  // (which derive controllerAddress from the data key, not the data value).
  const controllerAddress = bytesToHex(hexToBytes(dataValue as Hex));
  const arrayIndex = bytesToBigInt(hexToBytes(dataKey as Hex).slice(16));
  const id = `${address} - ${controllerAddress}`;

  // Track controller for UP verification (controllerProfile FK)
  ctx.trackAddress(EntityCategory.UniversalProfile, controllerAddress);

  // Check if another event already created this entity in the same batch
  const existing = ctx.getEntities<LSP6Controller>(CONTROLLER_TYPE).get(id);
  if (existing) {
    existing.arrayIndex = existing.arrayIndex ?? arrayIndex;
    existing.timestamp = new Date(timestamp);
    return;
  }

  const entity = new LSP6Controller({
    id,
    address,
    timestamp: new Date(timestamp),
    controllerAddress,
    arrayIndex,
  });

  ctx.addEntity(CONTROLLER_TYPE, entity.id, entity);
}

/**
 * Extract controller permissions from an AddressPermissions:Permissions event.
 *
 * controllerAddress: last 20 bytes of dataKey (bytes 12..32).
 * permissionsRawValue: raw 32-byte bitmap.
 * Sub-entities: one LSP6Permission per decoded permission flag.
 *
 * If dataValue is not 32 bytes, permissions are stored as raw value only
 * with no sub-entities decoded.
 */
function extractPermissions(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const id = `${address} - ${controllerAddress}`;

  // Track controller for UP verification (controllerProfile FK)
  ctx.trackAddress(EntityCategory.UniversalProfile, controllerAddress);

  // Get or create the merged controller entity
  const controller = getOrCreateController(address, controllerAddress, timestamp, ctx);
  controller.permissionsRawValue = dataValue;

  // Decode permissions into sub-entities if data is valid (32 bytes)
  if (isHex(dataValue) && hexToBytes(dataValue as Hex).length === 32) {
    const permissions = decodePermissions(dataValue as Hex);

    for (const permissionName of Object.keys(permissions)) {
      const permEntity = new LSP6Permission({
        id: `${id} - ${permissionName}`,
        permissionName,
        permissionValue: permissions[permissionName],
      });

      ctx.addEntity(PERMISSION_TYPE, permEntity.id, permEntity);
    }
  }
}

/**
 * Extract controller allowed calls from an AddressPermissions:AllowedCalls event.
 *
 * controllerAddress: last 20 bytes of dataKey (bytes 12..32).
 * allowedCallsRawValue: raw CompactBytesArray.
 * Sub-entities: one LSP6AllowedCall per decoded call entry (32 bytes each).
 *
 * Each allowed call entry is 32 bytes:
 *   - bytes 0..4:   restrictionOperations (4 bytes)
 *   - bytes 4..24:  allowedAddress (20 bytes)
 *   - bytes 24..28: allowedInterfaceId (4 bytes)
 *   - bytes 28..32: allowedFunction (4 bytes)
 */
function extractAllowedCalls(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const id = `${address} - ${controllerAddress}`;

  // Track controller for UP verification (controllerProfile FK)
  ctx.trackAddress(EntityCategory.UniversalProfile, controllerAddress);

  // Get or create the merged controller entity
  const controller = getOrCreateController(address, controllerAddress, timestamp, ctx);
  controller.allowedCallsRawValue = dataValue;

  // Decode allowed calls from CompactBytesArray
  try {
    const allowedCalls: Hex[] = decodeValueType('bytes[CompactBytesArray]', dataValue);

    for (let i = 0; i < allowedCalls.length; i++) {
      const callBytes = hexToBytes(allowedCalls[i] as Hex);
      const callEntity = new LSP6AllowedCall({
        id: `${id} - ${i}`,
        restrictionOperations: bytesToHex(callBytes.slice(0, 4)),
        allowedAddress: bytesToHex(callBytes.slice(4, 24)),
        allowedInterfaceId: bytesToHex(callBytes.slice(24, 28)),
        allowedFunction: bytesToHex(callBytes.slice(28)),
      });

      ctx.addEntity(ALLOWED_CALL_TYPE, callEntity.id, callEntity);
    }
  } catch {
    // Invalid CompactBytesArray — raw value is preserved but no sub-entities
  }
}

/**
 * Extract controller allowed ERC725Y data keys from an
 * AddressPermissions:AllowedERC725YDataKeys event.
 *
 * controllerAddress: last 20 bytes of dataKey (bytes 12..32).
 * allowedDataKeysRawValue: raw CompactBytesArray.
 * Sub-entities: one LSP6AllowedERC725YDataKey per decoded allowed key.
 */
function extractAllowedDataKeys(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: number,
  ctx: IBatchContext,
): void {
  const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const id = `${address} - ${controllerAddress}`;

  // Track controller for UP verification (controllerProfile FK)
  ctx.trackAddress(EntityCategory.UniversalProfile, controllerAddress);

  // Get or create the merged controller entity
  const controller = getOrCreateController(address, controllerAddress, timestamp, ctx);
  controller.allowedDataKeysRawValue = dataValue;

  // Decode allowed data keys from CompactBytesArray
  try {
    const allowedKeys: Hex[] = decodeValueType('bytes[CompactBytesArray]', dataValue);

    for (let i = 0; i < allowedKeys.length; i++) {
      const keyEntity = new LSP6AllowedERC725YDataKey({
        id: `${id} - ${i}`,
        allowedDataKey: allowedKeys[i],
      });

      ctx.addEntity(ALLOWED_DATA_KEY_TYPE, keyEntity.id, keyEntity);
    }
  } catch {
    // Invalid CompactBytesArray — raw value is preserved but no sub-entities
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Get an existing LSP6Controller entity from the batch, or create a new one.
 *
 * Multiple data key events for the same controller can fire in the same batch
 * (Index + Permissions + AllowedCalls + AllowedDataKeys). Each event fills in
 * its own fields on the shared entity.
 */
function getOrCreateController(
  address: string,
  controllerAddress: string,
  timestamp: number,
  ctx: IBatchContext,
): LSP6Controller {
  const id = `${address} - ${controllerAddress}`;
  const existing = ctx.getEntities<LSP6Controller>(CONTROLLER_TYPE).get(id);

  if (existing) {
    existing.timestamp = new Date(timestamp);
    return existing;
  }

  const entity = new LSP6Controller({
    id,
    address,
    timestamp: new Date(timestamp),
    controllerAddress,
  });

  ctx.addEntity(CONTROLLER_TYPE, entity.id, entity);
  return entity;
}

/**
 * Link sub-entities to their parent LSP6Controller after populate.
 *
 * Sub-entities are created during extract without a controller FK
 * (the controller may not survive populate if its UP is unverified).
 * This function links surviving sub-entities to their parent controller
 * and removes orphans whose parent was filtered out.
 *
 * Sub-entity IDs follow the pattern `"{upAddress} - {controllerAddress} - {suffix}"`,
 * so the controller ID is the first two segments: `"{upAddress} - {controllerAddress}"`.
 */
function linkSubEntitiesToController(ctx: IBatchContext, subEntityType: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subEntities = ctx.getEntities<Record<string, any>>(subEntityType);
  const controllers = ctx.getEntities<LSP6Controller>(CONTROLLER_TYPE);

  for (const [id, entity] of subEntities) {
    // Extract controller ID from sub-entity ID: "{upAddress} - {controllerAddress} - {suffix}"
    const lastSepIdx = id.lastIndexOf(' - ');
    const controllerId = id.substring(0, lastSepIdx);
    const controller = controllers.get(controllerId);

    if (controller) {
      entity.controller = new LSP6Controller({ id: controllerId });
    } else {
      // Parent controller was removed during populate (unverified UP) — remove orphan
      ctx.removeEntity(subEntityType, id);
    }
  }
}

export default LSP6ControllersPlugin;
