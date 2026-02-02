/**
 * TokenIdDataChanged event plugin.
 *
 * Handles the `TokenIdDataChanged(bytes32,bytes32,bytes)` event emitted by
 * LSP8 identifiable digital assets when per-token ERC725Y data is updated.
 *
 * This event fires whenever a data key is set on a specific tokenId of an
 * LSP8 contract. The plugin extracts the raw event entity.
 *
 * Converted from factory function (`createTokenIdDataChangedPlugin(registry)`)
 * to a plain export. The factory previously captured the PluginRegistry in a
 * closure for DataKey routing during extraction. DataKey routing is now
 * deferred to EntityHandlers (see #103: DataKey handler architecture).
 * As a plain export, this plugin is auto-discovered by PluginRegistry.discover().
 *
 * NFT entity creation is handled by the NFT EntityHandler (issue #104).
 * The emitting address is queued for verification as a DigitalAsset.
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 *
 * Port from v1:
 *   - scanner.ts L454-471 (event matching)
 *   - utils/tokenIdDataChanged/index.ts (extract + populate)
 */
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/abi';
import { TokenIdDataChanged } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'TokenIdDataChanged';

const TokenIdDataChangedPlugin: EventPlugin = {
  name: 'tokenIdDataChanged',
  topic0: LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic,
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { tokenId, dataKey, dataValue } =
      LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);

    const entity = new TokenIdDataChanged({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      tokenId,
      dataKey,
      dataValue,
      digitalAsset: null,
      nft: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for digitalAsset FK
    ctx.queueEnrichment({
      category: EntityCategory.DigitalAsset,
      address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
    });

    // Queue enrichment for nft FK.
    // Depends on #104 (NFT EntityHandler) to create NFT entities in Step 3
    // before the pipeline resolves this FK in Step 6.
    ctx.queueEnrichment({
      category: EntityCategory.NFT,
      address,
      tokenId,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'nft',
    });
  },
};

export default TokenIdDataChangedPlugin;
