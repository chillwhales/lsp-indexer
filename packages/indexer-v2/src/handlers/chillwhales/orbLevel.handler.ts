/**
 * OrbLevel entity handler (ChillWhales-specific).
 *
 * Subscribes to TokenIdDataChanged events and creates OrbLevel and
 * OrbCooldownExpiry entities for events matching the ORB_LEVEL_KEY data key
 * on the ORBS contract.
 *
 * The data value packs two uint32 values:
 *   - **bytes 0–3**: orb level (uint32)
 *   - **bytes 4–7**: cooldown expiry timestamp (uint32)
 *
 * Produces two entity types from a single data key:
 *   - `OrbLevel`          — current level of the orb NFT
 *   - `OrbCooldownExpiry` — cooldown expiry timestamp after level-up
 *
 * Both entities are scoped to the ORBS contract address. Events from
 * other contracts matching the same data key hash are ignored.
 *
 * Entity IDs follow the NFT id pattern: `"{address} - {tokenId}"`.
 *
 * Port from v1:
 *   - plugins/datakeys/chillwhales/orbLevel.plugin.ts (extract + populate + persist)
 *   - app/handlers/orbsLevelHandler.ts (OrbLevel + OrbCooldownExpiry from TokenIdDataChanged)
 *   - constants/chillwhales.ts (ORB_LEVEL_KEY, ORBS_ADDRESS)
 */
import { ORB_LEVEL_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { OrbCooldownExpiry, OrbLevel, TokenIdDataChanged } from '@chillwhales/typeorm';
import { bytesToNumber, hexToBytes, isAddressEqual, isHex, sliceBytes } from 'viem';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const ORB_LEVEL_TYPE = 'OrbLevel';
const ORB_COOLDOWN_EXPIRY_TYPE = 'OrbCooldownExpiry';

const OrbLevelHandler: EntityHandler = {
  name: 'orbLevel',
  listensToBag: ['TokenIdDataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities<TokenIdDataChanged>(triggeredBy);

    for (const event of events.values()) {
      // Filter by contract address
      if (!isAddressEqual(event.address, ORBS_ADDRESS)) continue;

      // Filter by data key
      if (event.dataKey !== ORB_LEVEL_KEY) continue;

      // Generate NFT id
      const id = generateTokenId({ address: event.address, tokenId: event.tokenId });

      // Decode packed data value: [level(uint32), cooldownExpiry(uint32)]
      if (isHex(event.dataValue) && hexToBytes(event.dataValue).length >= 8) {
        const dataBytes = hexToBytes(event.dataValue);
        const level = bytesToNumber(sliceBytes(dataBytes, 0, 4));
        const cooldownExpiry = bytesToNumber(sliceBytes(dataBytes, 4));

        // Create OrbLevel entity
        const levelEntity = new OrbLevel({
          id,
          address: event.address,
          tokenId: event.tokenId,
          value: level,
          digitalAsset: null, // FK initially null
          nft: null, // FK initially null
        });

        hctx.batchCtx.addEntity(ORB_LEVEL_TYPE, id, levelEntity);

        // Create OrbCooldownExpiry entity
        const cooldownEntity = new OrbCooldownExpiry({
          id,
          address: event.address,
          tokenId: event.tokenId,
          value: cooldownExpiry,
          digitalAsset: null, // FK initially null
          nft: null, // FK initially null
        });

        hctx.batchCtx.addEntity(ORB_COOLDOWN_EXPIRY_TYPE, id, cooldownEntity);

        // Queue enrichment for digitalAsset FK (both entities)
        hctx.batchCtx.queueEnrichment<OrbLevel>({
          category: EntityCategory.DigitalAsset,
          address: event.address,
          entityType: ORB_LEVEL_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
        });

        hctx.batchCtx.queueEnrichment<OrbCooldownExpiry>({
          category: EntityCategory.DigitalAsset,
          address: event.address,
          entityType: ORB_COOLDOWN_EXPIRY_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
        });

        // Queue enrichment for nft FK (both entities)
        hctx.batchCtx.queueEnrichment<OrbLevel>({
          category: EntityCategory.NFT,
          address: event.address,
          tokenId: event.tokenId,
          entityType: ORB_LEVEL_TYPE,
          entityId: id,
          fkField: 'nft',
        });

        hctx.batchCtx.queueEnrichment<OrbCooldownExpiry>({
          category: EntityCategory.NFT,
          address: event.address,
          tokenId: event.tokenId,
          entityType: ORB_COOLDOWN_EXPIRY_TYPE,
          entityId: id,
          fkField: 'nft',
        });
      }
    }
  },
};

export default OrbLevelHandler;
