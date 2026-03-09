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
 */
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { isNullAddress } from '@/utils';
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
    ctx.queueEnrichment<Transfer>({
      category: EntityCategory.DigitalAsset,
      address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
      blockNumber: height,
      transactionIndex,
      logIndex,
    });

    // Queue enrichment for nft FK.
    // Depends on #104 (NFT EntityHandler) to create NFT entities in Step 3
    // before the pipeline resolves this FK in Step 6.
    ctx.queueEnrichment<Transfer>({
      category: EntityCategory.NFT,
      address,
      tokenId,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'nft',
      blockNumber: height,
      transactionIndex,
      logIndex,
    });

    // Queue enrichment for from/to/operator UniversalProfile FKs
    // Skip null-ish addresses (zero/dead) to avoid wasteful RPC calls
    if (!isNullAddress(from)) {
      ctx.queueEnrichment<Transfer>({
        category: EntityCategory.UniversalProfile,
        address: from,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'fromProfile',
        blockNumber: height,
        transactionIndex,
        logIndex,
      });
    }
    if (!isNullAddress(to)) {
      ctx.queueEnrichment<Transfer>({
        category: EntityCategory.UniversalProfile,
        address: to,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'toProfile',
        blockNumber: height,
        transactionIndex,
        logIndex,
      });
    }
    if (!isNullAddress(operator)) {
      ctx.queueEnrichment<Transfer>({
        category: EntityCategory.UniversalProfile,
        address: operator,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'operatorProfile',
        blockNumber: height,
        transactionIndex,
        logIndex,
      });
    }
  },
};

export default LSP8TransferPlugin;
