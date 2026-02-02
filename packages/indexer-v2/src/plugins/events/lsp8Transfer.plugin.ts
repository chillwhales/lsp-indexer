/**
 * LSP8 Transfer event plugin.
 *
 * Handles the `Transfer(address,address,address,bytes32,bool,bytes)` event
 * emitted by LSP8 identifiable (NFT) digital assets.
 *
 * LSP8 vs LSP7 distinction: Different event signatures produce different
 * topic0 hashes. LSP8 has `bytes32 tokenId` (indexed), while LSP7 has
 * `uint256 amount` (non-indexed). This plugin only handles the LSP8 variant.
 *
 * Emitting address and from/to are queued for verification.
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 *
 * NFT entity creation (for mint/burn events) will be handled by the NFT
 * EntityHandler (issue #104).
 *
 * TotalSupply and OwnedAssets updates will be implemented as EntityHandlers
 * in future issues (see #105: Transfer-derived entity handlers).
 *
 * Port from v1:
 *   - scanner.ts L440-452 (event matching + NFT extraction)
 *   - utils/transfer/index.ts (extract LSP8 branch + populate)
 */
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/abi';
import { Transfer } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP8Transfer';

const LSP8TransferPlugin: EventPlugin = {
  name: 'lsp8Transfer',
  topic0: LSP8IdentifiableDigitalAsset.events.Transfer.topic,
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { operator, from, to, tokenId, force, data } =
      LSP8IdentifiableDigitalAsset.events.Transfer.decode(log);

    const entity = new Transfer({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      operator,
      from,
      to,
      amount: 1n,
      tokenId,
      force,
      data,
      fromProfile: null,
      toProfile: null,
      operatorProfile: null,
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

    // Queue enrichment for from/to/operator UniversalProfile FKs
    ctx.queueEnrichment({
      category: EntityCategory.UniversalProfile,
      address: from,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'fromProfile',
    });
    ctx.queueEnrichment({
      category: EntityCategory.UniversalProfile,
      address: to,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'toProfile',
    });
    ctx.queueEnrichment({
      category: EntityCategory.UniversalProfile,
      address: operator,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'operatorProfile',
    });
  },
};

export default LSP8TransferPlugin;
