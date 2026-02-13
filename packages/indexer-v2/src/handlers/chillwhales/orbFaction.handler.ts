/**
 * OrbFaction entity handler (ChillWhales-specific).
 *
 * Subscribes to TokenIdDataChanged events and creates OrbFaction entities
 * for events matching the ORB_FACTION_KEY data key on the ORBS contract.
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
 *   - plugins/datakeys/chillwhales/orbFaction.plugin.ts (extract + populate + persist)
 *   - app/handlers/orbsLevelHandler.ts (OrbFaction from TokenIdDataChanged)
 *   - constants/chillwhales.ts (ORB_FACTION_KEY, ORBS_ADDRESS)
 */
import { ORB_FACTION_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { OrbFaction, TokenIdDataChanged } from '@chillwhales/typeorm';
import { Hex, hexToString, isAddressEqual } from 'viem';

// ---------------------------------------------------------------------------
// Entity type key used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const ORB_FACTION_TYPE = 'OrbFaction';

const OrbFactionHandler: EntityHandler = {
  name: 'orbFaction',
  listensToBag: ['TokenIdDataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities<TokenIdDataChanged>(triggeredBy);

    for (const event of events.values()) {
      // Filter by contract address
      if (!isAddressEqual(event.address, ORBS_ADDRESS)) continue;

      // Filter by data key
      if (event.dataKey !== ORB_FACTION_KEY) continue;

      // Generate NFT id
      const id = generateTokenId({ address: event.address, tokenId: event.tokenId });
      const faction = hexToString(event.dataValue as Hex);

      // Create entity
      const entity = new OrbFaction({
        id,
        address: event.address,
        tokenId: event.tokenId,
        value: faction,
        digitalAsset: null, // FK initially null
        nft: null, // FK initially null
      });

      hctx.batchCtx.addEntity(ORB_FACTION_TYPE, id, entity);

      // Queue enrichment for digitalAsset FK
      hctx.batchCtx.queueEnrichment<OrbFaction>({
        category: EntityCategory.DigitalAsset,
        address: event.address,
        entityType: ORB_FACTION_TYPE,
        entityId: id,
        fkField: 'digitalAsset',
      });

      // Queue enrichment for nft FK
      hctx.batchCtx.queueEnrichment<OrbFaction>({
        category: EntityCategory.NFT,
        address: event.address,
        tokenId: event.tokenId,
        entityType: ORB_FACTION_TYPE,
        entityId: id,
        fkField: 'nft',
      });
    }
  },
};

export default OrbFactionHandler;
