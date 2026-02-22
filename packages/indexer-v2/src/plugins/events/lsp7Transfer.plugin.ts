/**
 * LSP7 Transfer event plugin.
 *
 * Handles the `Transfer(address,address,address,uint256,bool,bytes)` event
 * emitted by LSP7 fungible digital assets.
 *
 * LSP7 vs LSP8 distinction: Different event signatures produce different
 * topic0 hashes. LSP7 has `uint256 amount` (non-indexed), while LSP8 has
 * `bytes32 tokenId` (indexed). This plugin only handles the LSP7 variant.
 *
 * Emitting address and from/to are queued for verification.
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 *
 * TotalSupply and OwnedAssets updates will be implemented as EntityHandlers
 * in future issues (see #105: Transfer-derived entity handlers).
 *
 * Port from v1:
 *   - scanner.ts L429-438 (event matching)
 *   - utils/transfer/index.ts (extract + populate)
 */
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { isNullAddress } from '@/utils';
import { LSP7DigitalAsset } from '@chillwhales/abi';
import { Transfer } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP7Transfer';

const LSP7TransferPlugin: EventPlugin = {
  name: 'lsp7Transfer',
  topic0: LSP7DigitalAsset.events.Transfer.topic,
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { operator, from, to, amount, force, data } =
      LSP7DigitalAsset.events.Transfer.decode(log);

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
      amount,
      force,
      data,
      fromProfile: null,
      toProfile: null,
      operatorProfile: null,
      digitalAsset: null,
      // LSP7: no tokenId, no nft
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for digitalAsset FK
    ctx.queueEnrichment<Transfer>({
      category: EntityCategory.DigitalAsset,
      address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
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
      });
    }
    if (!isNullAddress(to)) {
      ctx.queueEnrichment<Transfer>({
        category: EntityCategory.UniversalProfile,
        address: to,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'toProfile',
      });
    }
    if (!isNullAddress(operator)) {
      ctx.queueEnrichment<Transfer>({
        category: EntityCategory.UniversalProfile,
        address: operator,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'operatorProfile',
      });
    }
  },
};

export default LSP7TransferPlugin;
