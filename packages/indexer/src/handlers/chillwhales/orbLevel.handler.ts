/**
 * OrbLevel entity handler (ChillWhales-specific).
 *
 * Subscribes to LSP8Transfer and TokenIdDataChanged events and creates
 * OrbLevel and OrbCooldownExpiry entities.
 *
 * LSP8Transfer (mint detection):
 *   - When an Orb NFT is minted (Transfer from zero address), creates defaults:
 *     - OrbLevel: value = 0
 *     - OrbCooldownExpiry: value = 0
 *
 * TokenIdDataChanged (ORB_LEVEL_KEY):
 *   - Overwrites defaults with actual on-chain values from data key changes
 *   - Data value packs two uint32 values:
 *     - **bytes 0–3**: orb level (uint32)
 *     - **bytes 4–7**: cooldown expiry timestamp (uint32)
 *
 * Produces two entity types:
 *   - `OrbLevel`          — current level of the orb NFT
 *   - `OrbCooldownExpiry` — cooldown expiry timestamp after level-up
 *
 * Both entities are scoped to the ORBS contract address. Events from
 * other contracts matching the same data key hash are ignored.
 *
 * Entity IDs follow the NFT id pattern: `"{address} - {tokenId}"`.
 */
import { ORB_LEVEL_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { getTypedEntities } from '@/core/entityTypeMap';
import { resolveEntity } from '@/core/handlerHelpers';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { OrbCooldownExpiry, OrbLevel } from '@chillwhales/typeorm';
import {
  bytesToNumber,
  getAddress,
  hexToBytes,
  isAddressEqual,
  isHex,
  sliceBytes,
  zeroAddress,
} from 'viem';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const ORB_LEVEL_TYPE = 'OrbLevel';
const ORB_COOLDOWN_EXPIRY_TYPE = 'OrbCooldownExpiry';

const OrbLevelHandler: EntityHandler = {
  name: 'orbLevel',
  listensToBag: ['LSP8Transfer', 'TokenIdDataChanged'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    // Branch on triggeredBy to handle mint detection vs data key changes
    if (triggeredBy === 'LSP8Transfer') {
      // MINT DETECTION: Create default entities when Orb NFTs are minted
      const transfers = getTypedEntities(hctx.batchCtx, 'LSP8Transfer');

      for (const transfer of transfers.values()) {
        // Filter to ORBS contract only
        if (!isAddressEqual(getAddress(transfer.address), ORBS_ADDRESS)) continue;

        // Filter to mints (from zero address)
        if (!isAddressEqual(getAddress(transfer.from), zeroAddress)) continue;

        // Generate NFT id
        const id = generateTokenId({ address: transfer.address, tokenId: transfer.tokenId });

        // Create OrbLevel entity with default value 0
        const levelEntity = new OrbLevel({
          id,
          address: transfer.address,
          tokenId: transfer.tokenId,
          blockNumber: transfer.blockNumber,
          transactionIndex: transfer.transactionIndex,
          logIndex: transfer.logIndex,
          value: 0,
          digitalAsset: null, // FK initially null
          nft: null, // FK initially null
        });

        hctx.batchCtx.addEntity(ORB_LEVEL_TYPE, id, levelEntity);

        // Create OrbCooldownExpiry entity with default value 0
        const cooldownEntity = new OrbCooldownExpiry({
          id,
          address: transfer.address,
          tokenId: transfer.tokenId,
          blockNumber: transfer.blockNumber,
          transactionIndex: transfer.transactionIndex,
          logIndex: transfer.logIndex,
          value: 0,
          digitalAsset: null, // FK initially null
          nft: null, // FK initially null
        });

        hctx.batchCtx.addEntity(ORB_COOLDOWN_EXPIRY_TYPE, id, cooldownEntity);

        // Queue enrichment for digitalAsset FK (both entities)
        hctx.batchCtx.queueEnrichment<OrbLevel>({
          category: EntityCategory.DigitalAsset,
          address: transfer.address,
          entityType: ORB_LEVEL_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
          blockNumber: transfer.blockNumber,
          transactionIndex: transfer.transactionIndex,
          logIndex: transfer.logIndex,
        });

        hctx.batchCtx.queueEnrichment<OrbCooldownExpiry>({
          category: EntityCategory.DigitalAsset,
          address: transfer.address,
          entityType: ORB_COOLDOWN_EXPIRY_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
          blockNumber: transfer.blockNumber,
          transactionIndex: transfer.transactionIndex,
          logIndex: transfer.logIndex,
        });

        // Queue enrichment for nft FK (both entities)
        hctx.batchCtx.queueEnrichment<OrbLevel>({
          category: EntityCategory.NFT,
          address: transfer.address,
          tokenId: transfer.tokenId,
          entityType: ORB_LEVEL_TYPE,
          entityId: id,
          fkField: 'nft',
          blockNumber: transfer.blockNumber,
          transactionIndex: transfer.transactionIndex,
          logIndex: transfer.logIndex,
        });

        hctx.batchCtx.queueEnrichment<OrbCooldownExpiry>({
          category: EntityCategory.NFT,
          address: transfer.address,
          tokenId: transfer.tokenId,
          entityType: ORB_COOLDOWN_EXPIRY_TYPE,
          entityId: id,
          fkField: 'nft',
          blockNumber: transfer.blockNumber,
          transactionIndex: transfer.transactionIndex,
          logIndex: transfer.logIndex,
        });
      }
    } else if (triggeredBy === 'TokenIdDataChanged') {
      // DATA KEY CHANGES: Overwrite defaults with actual on-chain values
      const events = getTypedEntities(hctx.batchCtx, 'TokenIdDataChanged');

      for (const event of events.values()) {
        // Filter by contract address
        if (!isAddressEqual(getAddress(event.address), ORBS_ADDRESS)) continue;

        // Filter by data key
        if (event.dataKey !== ORB_LEVEL_KEY) continue;

        // Generate NFT id
        const id = generateTokenId({ address: event.address, tokenId: event.tokenId });

        // Decode packed data value: [level(uint32), cooldownExpiry(uint32)]
        if (isHex(event.dataValue) && hexToBytes(event.dataValue).length >= 8) {
          const dataBytes = hexToBytes(event.dataValue);
          const level = bytesToNumber(sliceBytes(dataBytes, 0, 4));
          const cooldownExpiry = bytesToNumber(sliceBytes(dataBytes, 4));

          // Resolve entities from batch AND database (cross-batch FK preservation)
          const existingLevel = await resolveEntity(
            hctx.store,
            hctx.batchCtx,
            ORB_LEVEL_TYPE,
            OrbLevel,
            id,
          );
          const existingCooldown = await resolveEntity(
            hctx.store,
            hctx.batchCtx,
            ORB_COOLDOWN_EXPIRY_TYPE,
            OrbCooldownExpiry,
            id,
          );

          // Create OrbLevel entity, preserving existing FKs if entity was already created
          const levelEntity = new OrbLevel({
            ...(existingLevel ?? {}),
            id,
            address: event.address,
            tokenId: event.tokenId,
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
            logIndex: event.logIndex,
            value: level,
          });

          hctx.batchCtx.addEntity(ORB_LEVEL_TYPE, id, levelEntity);

          // Create OrbCooldownExpiry entity, preserving existing FKs if entity was already created
          const cooldownEntity = new OrbCooldownExpiry({
            ...(existingCooldown ?? {}),
            id,
            address: event.address,
            tokenId: event.tokenId,
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
            logIndex: event.logIndex,
            value: cooldownExpiry,
          });

          hctx.batchCtx.addEntity(ORB_COOLDOWN_EXPIRY_TYPE, id, cooldownEntity);

          // Queue enrichment for digitalAsset FK (both entities)
          hctx.batchCtx.queueEnrichment<OrbLevel>({
            category: EntityCategory.DigitalAsset,
            address: event.address,
            entityType: ORB_LEVEL_TYPE,
            entityId: id,
            fkField: 'digitalAsset',
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
            logIndex: event.logIndex,
          });

          hctx.batchCtx.queueEnrichment<OrbCooldownExpiry>({
            category: EntityCategory.DigitalAsset,
            address: event.address,
            entityType: ORB_COOLDOWN_EXPIRY_TYPE,
            entityId: id,
            fkField: 'digitalAsset',
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
            logIndex: event.logIndex,
          });

          // Queue enrichment for nft FK (both entities)
          hctx.batchCtx.queueEnrichment<OrbLevel>({
            category: EntityCategory.NFT,
            address: event.address,
            tokenId: event.tokenId,
            entityType: ORB_LEVEL_TYPE,
            entityId: id,
            fkField: 'nft',
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
            logIndex: event.logIndex,
          });

          hctx.batchCtx.queueEnrichment<OrbCooldownExpiry>({
            category: EntityCategory.NFT,
            address: event.address,
            tokenId: event.tokenId,
            entityType: ORB_COOLDOWN_EXPIRY_TYPE,
            entityId: id,
            fkField: 'nft',
            blockNumber: event.blockNumber,
            transactionIndex: event.transactionIndex,
            logIndex: event.logIndex,
          });
        }
      }
    }
  },
};

export default OrbLevelHandler;
