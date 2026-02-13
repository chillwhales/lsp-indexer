/**
 * OrbFaction entity handler (ChillWhales-specific).
 *
 * Subscribes to LSP8Transfer and TokenIdDataChanged events and creates
 * OrbFaction entities.
 *
 * LSP8Transfer (mint detection):
 *   - When an Orb NFT is minted (Transfer from zero address), creates default:
 *     - OrbFaction: value = 'Neutral'
 *
 * TokenIdDataChanged (ORB_FACTION_KEY):
 *   - Overwrites defaults with actual on-chain values from data key changes
 *   - Data value contains UTF-8 encoded faction name string
 *     (e.g. "Neutral", "Fire", "Water", etc.)
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
 *   - app/handlers/orbsLevelHandler.ts (OrbFaction from TokenIdDataChanged and mint defaults)
 *   - constants/chillwhales.ts (ORB_FACTION_KEY, ORBS_ADDRESS)
 */
import { ORB_FACTION_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { OrbFaction, TokenIdDataChanged, Transfer } from '@chillwhales/typeorm';
import { getAddress, Hex, hexToString, isAddressEqual, zeroAddress } from 'viem';

// ---------------------------------------------------------------------------
// Entity type key used in the BatchContext entity bag
// ---------------------------------------------------------------------------
const ORB_FACTION_TYPE = 'OrbFaction';

const OrbFactionHandler: EntityHandler = {
  name: 'orbFaction',
  listensToBag: ['LSP8Transfer', 'TokenIdDataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    // Branch on triggeredBy to handle mint detection vs data key changes
    if (triggeredBy === 'LSP8Transfer') {
      // MINT DETECTION: Create default entity when Orb NFTs are minted
      const transfers = hctx.batchCtx.getEntities<Transfer>(triggeredBy);

      for (const transfer of transfers.values()) {
        // Filter to ORBS contract only
        if (!isAddressEqual(getAddress(transfer.address), ORBS_ADDRESS)) continue;

        // Filter to mints (from zero address)
        if (!isAddressEqual(getAddress(transfer.from), zeroAddress)) continue;

        // Generate NFT id
        const id = generateTokenId({ address: transfer.address, tokenId: transfer.tokenId });

        // Create OrbFaction entity with default value 'Neutral'
        const entity = new OrbFaction({
          id,
          address: transfer.address,
          tokenId: transfer.tokenId,
          value: 'Neutral',
          digitalAsset: null, // FK initially null
          nft: null, // FK initially null
        });

        hctx.batchCtx.addEntity(ORB_FACTION_TYPE, id, entity);

        // Queue enrichment for digitalAsset FK
        hctx.batchCtx.queueEnrichment<OrbFaction>({
          category: EntityCategory.DigitalAsset,
          address: transfer.address,
          entityType: ORB_FACTION_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
        });

        // Queue enrichment for nft FK
        hctx.batchCtx.queueEnrichment<OrbFaction>({
          category: EntityCategory.NFT,
          address: transfer.address,
          tokenId: transfer.tokenId,
          entityType: ORB_FACTION_TYPE,
          entityId: id,
          fkField: 'nft',
        });
      }
    } else if (triggeredBy === 'TokenIdDataChanged') {
      // DATA KEY CHANGES: Overwrite defaults with actual on-chain values
      const events = hctx.batchCtx.getEntities<TokenIdDataChanged>(triggeredBy);

      for (const event of events.values()) {
        // Filter by contract address
        if (!isAddressEqual(getAddress(event.address), ORBS_ADDRESS)) continue;

        // Filter by data key
        if (event.dataKey !== ORB_FACTION_KEY) continue;

        // Generate NFT id
        const id = generateTokenId({ address: event.address, tokenId: event.tokenId });
        const faction = hexToString(event.dataValue as Hex);

        // Check if entity exists in batch (e.g., from mint path in same batch)
        const existing = hctx.batchCtx.getEntities<OrbFaction>(ORB_FACTION_TYPE).get(id);

        // Create entity, preserving existing FKs if entity was already created
        const entity = new OrbFaction({
          id,
          address: event.address,
          tokenId: event.tokenId,
          value: faction,
          digitalAsset: existing?.digitalAsset ?? null, // Preserve FK if exists
          nft: existing?.nft ?? null, // Preserve FK if exists
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
    }
  },
};

export default OrbFactionHandler;
