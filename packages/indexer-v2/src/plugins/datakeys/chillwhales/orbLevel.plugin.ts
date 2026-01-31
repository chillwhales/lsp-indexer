/**
 * OrbLevel data key plugin (ChillWhales-specific).
 *
 * Handles the `ORB_LEVEL_KEY` data key emitted via
 * `TokenIdDataChanged(bytes32,bytes32,bytes)` on the ORBS contract.
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
 *   - app/handlers/orbsLevelHandler.ts (OrbLevel + OrbCooldownExpiry from TokenIdDataChanged)
 *   - constants/chillwhales.ts (ORB_LEVEL_KEY, ORBS_ADDRESS)
 */
import { DigitalAsset, NFT, OrbCooldownExpiry, OrbLevel } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { bytesToNumber, Hex, hexToBytes, isHex, sliceBytes } from 'viem';

import { ORB_LEVEL_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { upsertEntities } from '@/core/persistHelpers';
import { populateByDA } from '@/core/populateHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { generateTokenId } from '@/utils';

// ---------------------------------------------------------------------------
// Entity type keys used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const ORB_LEVEL_TYPE = 'OrbLevel';
const ORB_COOLDOWN_EXPIRY_TYPE = 'OrbCooldownExpiry';

const OrbLevelPlugin: DataKeyPlugin = {
  name: 'orbLevel',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === ORB_LEVEL_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { address } = log;

    // Only process events from the ORBS contract
    if (address.toLowerCase() !== ORBS_ADDRESS.toLowerCase()) return;

    // Only process TokenIdDataChanged events (3 topics)
    if (log.topics.length !== 3) return;

    const tokenId = log.topics[1];
    const id = generateTokenId({ address, tokenId });
    const da = new DigitalAsset({ id: address });
    const nft = new NFT({ id, tokenId, address });

    // Decode packed data value: [level(uint32), cooldownExpiry(uint32)]
    if (isHex(dataValue) && hexToBytes(dataValue as Hex).length >= 8) {
      const dataBytes = hexToBytes(dataValue as Hex);
      const level = bytesToNumber(sliceBytes(dataBytes, 0, 4));
      const cooldownExpiry = bytesToNumber(sliceBytes(dataBytes, 4));

      ctx.addEntity(
        ORB_LEVEL_TYPE,
        id,
        new OrbLevel({ id, address, digitalAsset: da, tokenId, nft, value: level }),
      );

      ctx.addEntity(
        ORB_COOLDOWN_EXPIRY_TYPE,
        id,
        new OrbCooldownExpiry({
          id,
          address,
          digitalAsset: da,
          tokenId,
          nft,
          value: cooldownExpiry,
        }),
      );
    }

    // Address tracking is handled by the TokenIdDataChanged meta-plugin (parent).
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<OrbLevel>(ctx, ORB_LEVEL_TYPE);
    populateByDA<OrbCooldownExpiry>(ctx, ORB_COOLDOWN_EXPIRY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await Promise.all([
      upsertEntities(store, ctx, ORB_LEVEL_TYPE),
      upsertEntities(store, ctx, ORB_COOLDOWN_EXPIRY_TYPE),
    ]);
  },
};

export default OrbLevelPlugin;
