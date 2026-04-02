/**
 * LSP6Controllers entity handler.
 *
 * Subscribes to DataChanged events and creates five types of entities from
 * five related AddressPermissions data key patterns:
 *
 *   1. **AddressPermissions[] length** — exact match on the array length key.
 *      Decodes a uint128 value representing the number of controllers.
 *      Entity: `LSP6ControllersLength` (deterministic id = address).
 *
 *   2. **AddressPermissions[] index** — prefix match on the index prefix.
 *      Decodes a controller address from the data value and the array index
 *      from the last 16 bytes of the data key.
 *
 *   3. **AddressPermissions:Permissions** — prefix match on the permissions prefix.
 *      Decodes the controller address from the data key (last 20 bytes) and
 *      the raw permissions bitmap from the data value (32 bytes).
 *      Sub-entities: `LSP6Permission` (one per decoded permission flag).
 *
 *   4. **AddressPermissions:AllowedCalls** — prefix match on the allowed calls prefix.
 *      Decodes the controller address from the data key (last 20 bytes) and
 *      a CompactBytesArray of allowed calls from the data value.
 *      Sub-entities: `LSP6AllowedCall` (one per decoded allowed call entry).
 *
 *   5. **AddressPermissions:AllowedERC725YDataKeys** — prefix match on the allowed data keys prefix.
 *      Decodes the controller address from the data key (last 20 bytes) and
 *      a CompactBytesArray of allowed data keys from the data value.
 *      Sub-entities: `LSP6AllowedERC725YDataKey` (one per allowed key).
 *
 * Index and Permissions/AllowedCalls/AllowedDataKeys events all create/update
 * the same merged `LSP6Controller` entity keyed by `"{upAddress} - {controllerAddress}"`.
 * Each source populates different fields; if multiple fire in the same batch,
 * later events merge into the existing entity.
 *
 * In-batch merge is preserved in the handler logic. Cross-batch merge uses
 * persist hints so the pipeline preserves non-null values in the specified
 * mergeFields when upserting.
 *
 * Sub-entities are cleared before re-inserting (delete-then-reinsert) via
 * the clear queue to keep them in sync with raw value changes.
 *
 * controllerAddress is enriched for UniversalProfile verification so the
 * optional `controllerProfile` FK can be populated when the controller is a UP.
 */
import { resolveEntities } from '@/core/handlerHelpers';
import { EntityCategory, type EntityHandler, type HandlerContext } from '@/core/types';
import { prefixId } from '@/utils';
import {
  DataChanged,
  LSP6AllowedCall,
  LSP6AllowedERC725YDataKey,
  LSP6Controller,
  LSP6ControllersLength,
  LSP6Permission,
} from '@/model';
import { decodePermissions, decodeValueType } from '@erc725/erc725.js';
import { LSP6DataKeys } from '@lukso/lsp6-contracts';
import { type Hex, bytesToBigInt, bytesToHex, hexToBigInt, hexToBytes, isHex } from 'viem';

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
const LSP6_LENGTH_KEY = LSP6DataKeys['AddressPermissions[]'].length;
const LSP6_INDEX_PREFIX = LSP6DataKeys['AddressPermissions[]'].index;
const LSP6_PERMISSIONS_PREFIX = LSP6DataKeys['AddressPermissions:Permissions'];
const LSP6_ALLOWED_CALLS_PREFIX = LSP6DataKeys['AddressPermissions:AllowedCalls'];
const LSP6_ALLOWED_DATA_KEYS_PREFIX = LSP6DataKeys['AddressPermissions:AllowedERC725YDataKeys'];

const LSP6ControllersHandler: EntityHandler = {
  name: 'lsp6Controllers',
  supportedChains: ['lukso', 'lukso-testnet'],
  listensToBag: ['DataChanged'],

  async handle(hctx, _triggeredBy): Promise<void> {
    const events = hctx.batchCtx.getEntities('DataChanged');

    // Set persist hint for cross-batch merge behavior (safety net)
    hctx.batchCtx.setPersistHint(CONTROLLER_TYPE, {
      entityClass: LSP6Controller,
      mergeFields: [
        'arrayIndex',
        'permissionsRawValue',
        'allowedCallsRawValue',
        'allowedDataKeysRawValue',
      ],
    });

    // Collect all potential entity IDs from Index/Permissions/AllowedCalls/AllowedDataKeys events
    const potentialIds: string[] = [];
    for (const event of events.values()) {
      const { dataKey, dataValue, address } = event;
      if (dataKey.startsWith(LSP6_INDEX_PREFIX)) {
        if (isHex(dataValue) && hexToBytes(dataValue).length === 20) {
          const controllerAddress = bytesToHex(hexToBytes(dataValue));
          potentialIds.push(`${address} - ${controllerAddress}`);
        }
      } else if (dataKey.startsWith(LSP6_PERMISSIONS_PREFIX)) {
        const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
        potentialIds.push(`${address} - ${controllerAddress}`);
      } else if (dataKey.startsWith(LSP6_ALLOWED_CALLS_PREFIX)) {
        const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
        potentialIds.push(`${address} - ${controllerAddress}`);
      } else if (dataKey.startsWith(LSP6_ALLOWED_DATA_KEYS_PREFIX)) {
        const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
        potentialIds.push(`${address} - ${controllerAddress}`);
      }
    }

    // Merge entities from BOTH BatchContext and database
    const existingControllers = await resolveEntities(
      hctx.store,
      hctx.batchCtx,
      CONTROLLER_TYPE,
      potentialIds,
    );

    for (const event of events.values()) {
      const { dataKey, dataValue, address, timestamp } = event;

      if (dataKey === LSP6_LENGTH_KEY) {
        extractLength(address, dataValue, timestamp, event, hctx);
      } else if (dataKey.startsWith(LSP6_INDEX_PREFIX)) {
        extractFromIndex(address, dataKey, dataValue, timestamp, event, hctx, existingControllers);
      } else if (dataKey.startsWith(LSP6_PERMISSIONS_PREFIX)) {
        extractPermissions(
          address,
          dataKey,
          dataValue,
          timestamp,
          event,
          hctx,
          existingControllers,
        );
      } else if (dataKey.startsWith(LSP6_ALLOWED_CALLS_PREFIX)) {
        extractAllowedCalls(
          address,
          dataKey,
          dataValue,
          timestamp,
          event,
          hctx,
          existingControllers,
        );
      } else if (dataKey.startsWith(LSP6_ALLOWED_DATA_KEYS_PREFIX)) {
        extractAllowedDataKeys(
          address,
          dataKey,
          dataValue,
          timestamp,
          event,
          hctx,
          existingControllers,
        );
      }
    }

    // Queue clear requests for sub-entity types that had new data in this batch
    const controllers = hctx.batchCtx.getEntities('LSP6Controller');
    if (controllers.size === 0) return;

    const controllerIds = [...controllers.keys()];

    if (hctx.batchCtx.hasEntities(PERMISSION_TYPE)) {
      hctx.batchCtx.queueClear({
        subEntityClass: LSP6Permission,
        fkField: 'controller',
        parentIds: controllerIds,
      });
    }

    if (hctx.batchCtx.hasEntities(ALLOWED_CALL_TYPE)) {
      hctx.batchCtx.queueClear({
        subEntityClass: LSP6AllowedCall,
        fkField: 'controller',
        parentIds: controllerIds,
      });
    }

    if (hctx.batchCtx.hasEntities(ALLOWED_DATA_KEY_TYPE)) {
      hctx.batchCtx.queueClear({
        subEntityClass: LSP6AllowedERC725YDataKey,
        fkField: 'controller',
        parentIds: controllerIds,
      });
    }

    // Link sub-entities to their parent controller
    // Sub-entities are created without controller FK; we link them here after
    // populate so orphans whose parent was filtered out get removed.
    linkSubEntitiesToController(hctx, 'LSP6Permission', controllers);
    linkSubEntitiesToController(hctx, 'LSP6AllowedCall', controllers);
    linkSubEntitiesToController(hctx, 'LSP6AllowedERC725YDataKey', controllers);
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
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
): void {
  const entity = new LSP6ControllersLength({
    id: prefixId(hctx.batchCtx.network, address),
    network: hctx.batchCtx.network,
    address,
    timestamp,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    value: isHex(dataValue) && hexToBytes(dataValue).length === 16 ? hexToBigInt(dataValue) : null,
    rawValue: dataValue,
    universalProfile: undefined, // FK resolved in enrichment step
  });

  hctx.batchCtx.addEntity(LENGTH_TYPE, entity.id, entity);

  // Queue enrichment for universalProfile FK
  hctx.batchCtx.queueEnrichment<LSP6ControllersLength>({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: LENGTH_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
    timestamp: event.timestamp.getTime(),
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
  });
}

/**
 * Extract controller from an AddressPermissions[] index (Item) event.
 *
 * controllerAddress: decoded from dataValue (must be exactly 20 bytes).
 * arrayIndex: last 16 bytes of dataKey converted to BigInt.
 *
 * If dataValue is not a valid 20-byte address, the event is skipped.
 *
 * Merges into existing LSP6Controller entity if one exists in EITHER
 * the current batch OR the database.
 */
function extractFromIndex(
  address: string,
  dataKey: string,
  dataValue: string,
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
  existingControllers: Map<string, LSP6Controller>,
): void {
  // Skip if dataValue is not a valid 20-byte address
  if (!isHex(dataValue) || hexToBytes(dataValue).length !== 20) return;

  // Normalize to lowercase 0x-prefixed via bytesToHex to match the format
  // used by extractPermissions/extractAllowedCalls/extractAllowedDataKeys
  // (which derive controllerAddress from the data key, not the data value).
  const controllerAddress = bytesToHex(hexToBytes(dataValue));
  const arrayIndex = bytesToBigInt(hexToBytes(dataKey as Hex).slice(16));
  const id = prefixId(hctx.batchCtx.network, `${address} - ${controllerAddress}`);

  // Check if entity exists in EITHER batch OR database
  const existing = existingControllers.get(id);
  if (existing) {
    existing.arrayIndex = existing.arrayIndex ?? arrayIndex;
    existing.timestamp = timestamp;
    // Add to batch if coming from DB so it gets persisted
    hctx.batchCtx.addEntity(CONTROLLER_TYPE, existing.id, existing);
    return;
  }

  const entity = new LSP6Controller({
    id,
    network: hctx.batchCtx.network,
    address,
    timestamp,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    controllerAddress,
    arrayIndex,
    universalProfile: undefined, // FK resolved in enrichment step
    controllerProfile: null,
  });

  hctx.batchCtx.addEntity(CONTROLLER_TYPE, entity.id, entity);
  existingControllers.set(id, entity); // Add to map for subsequent events

  // Queue enrichment for universalProfile FK (primary entity type)
  hctx.batchCtx.queueEnrichment<LSP6Controller>({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: CONTROLLER_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
    timestamp: event.timestamp.getTime(),
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
  });
  // Queue enrichment for controllerProfile FK (secondary UP reference)
  hctx.batchCtx.queueEnrichment<LSP6Controller>({
    category: EntityCategory.UniversalProfile,
    address: controllerAddress,
    entityType: CONTROLLER_TYPE,
    entityId: entity.id,
    fkField: 'controllerProfile',
    timestamp: event.timestamp.getTime(),
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
  });
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
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
  existingControllers: Map<string, LSP6Controller>,
): void {
  const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const id = prefixId(hctx.batchCtx.network, `${address} - ${controllerAddress}`);

  // Get or create the merged controller entity
  const controller = getOrCreateController(
    address,
    controllerAddress,
    timestamp,
    event,
    hctx,
    existingControllers,
  );
  controller.permissionsRawValue = dataValue;

  // Decode permissions into sub-entities if data is valid (32 bytes)
  if (isHex(dataValue) && hexToBytes(dataValue).length === 32) {
    const permissions = decodePermissions(dataValue);

    for (const [permissionName, permissionValue] of Object.entries(permissions)) {
      const permEntity = new LSP6Permission({
        id: `${id} - ${permissionName}`,
        network: hctx.batchCtx.network,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        permissionName,
        permissionValue,
        controller: null, // FK set later in linkSubEntitiesToController
      });
      hctx.batchCtx.addEntity(PERMISSION_TYPE, permEntity.id, permEntity);
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
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
  existingControllers: Map<string, LSP6Controller>,
): void {
  const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const id = prefixId(hctx.batchCtx.network, `${address} - ${controllerAddress}`);

  // Get or create the merged controller entity
  const controller = getOrCreateController(
    address,
    controllerAddress,
    timestamp,
    event,
    hctx,
    existingControllers,
  );
  controller.allowedCallsRawValue = dataValue;

  // Decode allowed calls from CompactBytesArray
  try {
    const allowedCalls = decodeValueType('bytes[CompactBytesArray]', dataValue) as string[];

    for (let i = 0; i < allowedCalls.length; i++) {
      const callBytes = hexToBytes(allowedCalls[i] as Hex);
      const callEntity = new LSP6AllowedCall({
        id: `${id} - ${i}`,
        network: hctx.batchCtx.network,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        restrictionOperations: bytesToHex(callBytes.slice(0, 4)),
        allowedAddress: bytesToHex(callBytes.slice(4, 24)),
        allowedInterfaceId: bytesToHex(callBytes.slice(24, 28)),
        allowedFunction: bytesToHex(callBytes.slice(28)),
        controller: null, // FK set later in linkSubEntitiesToController
      });
      hctx.batchCtx.addEntity(ALLOWED_CALL_TYPE, callEntity.id, callEntity);
    }
  } catch (error) {
    // Invalid CompactBytesArray — raw value is preserved but no sub-entities
    hctx.context.log.warn(
      {
        step: 'HANDLE',
        handler: 'lsp6Controllers',
        address,
        controllerAddress,
        dataValue,
        error: error instanceof Error ? error.message : 'Unknown decode error',
      },
      'Failed to decode LSP6 allowed calls',
    );
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
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
  existingControllers: Map<string, LSP6Controller>,
): void {
  const controllerAddress = bytesToHex(hexToBytes(dataKey as Hex).slice(12));
  const id = prefixId(hctx.batchCtx.network, `${address} - ${controllerAddress}`);

  // Get or create the merged controller entity
  const controller = getOrCreateController(
    address,
    controllerAddress,
    timestamp,
    event,
    hctx,
    existingControllers,
  );
  controller.allowedDataKeysRawValue = dataValue;

  // Decode allowed data keys from CompactBytesArray
  try {
    const allowedKeys = decodeValueType('bytes[CompactBytesArray]', dataValue) as string[];

    for (let i = 0; i < allowedKeys.length; i++) {
      const keyEntity = new LSP6AllowedERC725YDataKey({
        id: `${id} - ${i}`,
        network: hctx.batchCtx.network,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        allowedDataKey: allowedKeys[i],
        controller: null, // FK set later in linkSubEntitiesToController
      });
      hctx.batchCtx.addEntity(ALLOWED_DATA_KEY_TYPE, keyEntity.id, keyEntity);
    }
  } catch (error) {
    // Invalid CompactBytesArray — raw value is preserved but no sub-entities
    hctx.context.log.warn(
      {
        step: 'HANDLE',
        handler: 'lsp6Controllers',
        address,
        controllerAddress,
        dataValue,
        error: error instanceof Error ? error.message : 'Unknown decode error',
      },
      'Failed to decode LSP6 allowed ERC725Y data keys',
    );
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Get an existing LSP6Controller entity from EITHER batch OR database, or create a new one.
 *
 * Multiple data key events for the same controller can fire in the same batch
 * (Index + Permissions + AllowedCalls + AllowedDataKeys). Each event fills in
 * its own fields on the shared entity.
 */
function getOrCreateController(
  address: string,
  controllerAddress: string,
  timestamp: Date,
  event: DataChanged,
  hctx: HandlerContext,
  existingControllers: Map<string, LSP6Controller>,
): LSP6Controller {
  const id = prefixId(hctx.batchCtx.network, `${address} - ${controllerAddress}`);
  const existing = existingControllers.get(id);

  if (existing) {
    existing.timestamp = timestamp;
    // Add to batch if coming from DB so it gets persisted
    hctx.batchCtx.addEntity(CONTROLLER_TYPE, existing.id, existing);
    return existing;
  }

  const entity = new LSP6Controller({
    id,
    address,
    network: hctx.batchCtx.network,
    timestamp,
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
    controllerAddress,
    universalProfile: undefined, // FK resolved in enrichment step
    controllerProfile: null,
  });

  hctx.batchCtx.addEntity(CONTROLLER_TYPE, entity.id, entity);
  existingControllers.set(id, entity); // Add to map for subsequent events

  // Queue enrichment for universalProfile FK (primary entity type)
  hctx.batchCtx.queueEnrichment<LSP6Controller>({
    category: EntityCategory.UniversalProfile,
    address,
    entityType: CONTROLLER_TYPE,
    entityId: entity.id,
    fkField: 'universalProfile',
    timestamp: event.timestamp.getTime(),
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
  });
  // Queue enrichment for controllerProfile FK (secondary UP reference)
  hctx.batchCtx.queueEnrichment<LSP6Controller>({
    category: EntityCategory.UniversalProfile,
    address: controllerAddress,
    entityType: CONTROLLER_TYPE,
    entityId: entity.id,
    fkField: 'controllerProfile',
    timestamp: event.timestamp.getTime(),
    blockNumber: event.blockNumber,
    transactionIndex: event.transactionIndex,
    logIndex: event.logIndex,
  });

  return entity;
}

/**
 * Link sub-entities to their parent LSP6Controller.
 *
 * Sub-entities are created during extract without a controller FK
 * (the controller may not survive enrichment if its UP is unverified).
 * This function links sub-entities to their parent controller and removes
 * orphans whose parent doesn't exist.
 *
 * Why orphan removal is needed despite Step 3.5 (Clear Queue):
 * - Step 3.5 runs BEFORE this handler completes (it's triggered by queueClear calls)
 * - Step 3.5 only clears sub-entities whose parent IDs are in the current batch
 * - If a controller is created in this batch but then filtered out during the
 *   extract phase (e.g., invalid data), its sub-entities were never queued for
 *   clearing and must be removed here to prevent orphans
 * - This is a safety net for within-batch orphans, while Step 3.5 handles
 *   cross-batch updates where parent entities already exist in the database
 *
 * Sub-entity IDs follow the pattern `"{upAddress} - {controllerAddress} - {suffix}"`,
 * so the controller ID is the first two segments: `"{upAddress} - {controllerAddress}"`.
 */
function linkSubEntitiesToController(
  hctx: HandlerContext,
  subEntityType: 'LSP6Permission' | 'LSP6AllowedCall' | 'LSP6AllowedERC725YDataKey',
  controllers: Map<string, LSP6Controller>,
): void {
  const subEntities = hctx.batchCtx.getEntities(subEntityType);

  for (const [id, entity] of subEntities) {
    // Extract controller ID from sub-entity ID: "{upAddress} - {controllerAddress} - {suffix}"
    const lastSepIdx = id.lastIndexOf(' - ');
    if (lastSepIdx === -1) continue;
    const controllerId = id.substring(0, lastSepIdx);

    const controller = controllers.get(controllerId);
    if (controller) {
      entity.controller = new LSP6Controller({ id: controllerId });
    } else {
      // Parent controller doesn't exist in this batch — likely removed during enrichment.
      // Remove the orphaned sub-entity from the batch to prevent persistence of orphans.
      subEntities.delete(id);
    }
  }
}

export default LSP6ControllersHandler;
