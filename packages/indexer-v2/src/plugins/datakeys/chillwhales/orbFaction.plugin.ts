/**
 * OrbFaction data key plugin (ChillWhales-specific).
 *
 * Handles the `ORB_FACTION_KEY` data key emitted via
 * `TokenIdDataChanged(bytes32,bytes32,bytes)` on the ORBS contract.
 *
 * The data value contains a UTF-8 encoded faction name string
 * (e.g. "Neutral", "Fire", "Water", etc.).
 *
 * Produces a single entity type:
 *   - `OrbFaction` — current faction of the orb NFT
 *
 * Scoped to the ORBS contract address. Events from other contracts
 * matching the same data key hash are ignored.
 *
 * Entity ID follows the NFT id pattern: `"{address} - {tokenId}"`.
 *
 * Port from v1:
 *   - app/handlers/orbsLevelHandler.ts (OrbFaction from TokenIdDataChanged)
 *   - constants/chillwhales.ts (ORB_FACTION_KEY, ORBS_ADDRESS)
 */
import { DigitalAsset, NFT, OrbFaction } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { Hex, hexToString } from 'viem';

import { ORB_FACTION_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { populateByDA, upsertEntities } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { generateTokenId } from '@/utils';

// ---------------------------------------------------------------------------
// Entity type key used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const ORB_FACTION_TYPE = 'OrbFaction';

const OrbFactionPlugin: DataKeyPlugin = {
  name: 'orbFaction',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === ORB_FACTION_KEY;
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
    const faction = hexToString(dataValue as Hex);

    ctx.addEntity(
      ORB_FACTION_TYPE,
      id,
      new OrbFaction({
        id,
        address,
        digitalAsset: new DigitalAsset({ id: address }),
        tokenId,
        nft: new NFT({ id, tokenId, address }),
        value: faction,
      }),
    );

    // Address tracking is handled by the TokenIdDataChanged meta-plugin (parent).
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<OrbFaction>(ctx, ORB_FACTION_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await upsertEntities(store, ctx, ORB_FACTION_TYPE);
  },
};

export default OrbFactionPlugin;
