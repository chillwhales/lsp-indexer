/**
 * ChillClaimed entity handler (ChillWhales-specific).
 *
 * Subscribes to LSP8Transfer events and creates ChillClaimed entities in two phases:
 * 1. On mint transfers (from zero address to CHILLWHALES_ADDRESS), create entities with value=false
 * 2. At chain head (isHead=true), verify claimed status via CHILL contract Multicall3, update value=true
 *
 * Produces a single entity type:
 *   - `ChillClaimed` — tracks which Chillwhale NFTs have claimed their CHILL tokens
 *
 * Phase 1 runs on every batch. Phase 2 only runs at chain head to avoid wasteful RPC calls.
 */
import { CHILL } from '@/abi';
import { Aggregate3StaticReturn } from '@/abi/Multicall3';
import { CHILL_ADDRESS, CHILLWHALES_ADDRESS } from '@/constants/chillwhales';
import { aggregate3StaticLatest } from '@/core/multicall';
import { EntityCategory, EntityHandler } from '@/core/types';
import { ChillClaimed, Transfer } from '@/model';
import { generateTokenId, isNullAddress, safeHexToBool } from '@/utils';
import { getAddress, isAddressEqual, isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'ChillClaimed';

// Multicall batch size
const BATCH_SIZE = 500;

const ChillClaimedHandler: EntityHandler = {
  name: 'chillClaimed',
  supportedChains: ['lukso'],
  listensToBag: ['LSP8Transfer'],
  postVerification: false,

  async handle(hctx, _triggeredBy): Promise<void> {
    const { context, batchCtx, isHead, store, multicallAddress } = hctx;

    // PHASE 1: Mint detection (runs every batch)
    // Filter LSP8Transfer events to Chillwhale mints (from zero address to CHILLWHALES_ADDRESS)
    const events = batchCtx.getEntities('LSP8Transfer');
    const mintTransfers: Transfer[] = [];

    for (const event of events.values()) {
      if (
        isAddressEqual(getAddress(event.address), CHILLWHALES_ADDRESS) &&
        isNullAddress(event.from)
      ) {
        mintTransfers.push(event);
      }
    }

    // Create ChillClaimed entities for new mints
    if (mintTransfers.length > 0) {
      for (const event of mintTransfers) {
        const id = generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId: event.tokenId });

        const entity = new ChillClaimed({
          id,
          address: CHILLWHALES_ADDRESS,
          timestamp: event.timestamp,
          blockNumber: event.blockNumber,
          transactionIndex: event.transactionIndex,
          logIndex: event.logIndex,
          digitalAsset: null, // FK initially null — resolved by enrichment queue
          tokenId: event.tokenId,
          nft: null, // FK initially null — resolved by enrichment queue
          value: false, // Not yet verified on-chain
        });

        batchCtx.addEntity(ENTITY_TYPE, id, entity);

        // Queue enrichment for digitalAsset FK
        batchCtx.queueEnrichment<ChillClaimed>({
          category: EntityCategory.DigitalAsset,
          address: CHILLWHALES_ADDRESS,
          entityType: ENTITY_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
          timestamp: event.timestamp.getTime(),
          blockNumber: event.blockNumber,
          transactionIndex: event.transactionIndex,
          logIndex: event.logIndex,
        });

        // Queue enrichment for nft FK
        batchCtx.queueEnrichment<ChillClaimed>({
          category: EntityCategory.NFT,
          address: CHILLWHALES_ADDRESS,
          tokenId: event.tokenId,
          entityType: ENTITY_TYPE,
          entityId: id,
          fkField: 'nft',
          timestamp: event.timestamp.getTime(),
          blockNumber: event.blockNumber,
          transactionIndex: event.transactionIndex,
          logIndex: event.logIndex,
        });
      }
    }

    // PHASE 2: On-chain verification (runs at chain head only)
    if (!isHead) return;

    // Query database for unclaimed ChillClaimed entities (value=false)
    const unclaimedEntities = await store.findBy(ChillClaimed, { value: false });

    if (unclaimedEntities.length === 0) return;

    context.log.info(
      { step: 'HANDLE', handler: 'chillClaimed', totalCount: unclaimedEntities.length },
      'Verifying CHILL claimed status',
    );

    // Batch multicall to CHILL contract
    const result: Aggregate3StaticReturn = [];
    let batchIndex = 0;
    const batchesCount = Math.ceil(unclaimedEntities.length / BATCH_SIZE);

    while (batchIndex < batchesCount) {
      const start = batchIndex * BATCH_SIZE;
      const batch = unclaimedEntities.slice(start, start + BATCH_SIZE);

      context.log.info(
        {
          step: 'HANDLE',
          handler: 'chillClaimed',
          batchIndex,
          batchSize: batch.length,
          verifiedCount: start,
          unverifiedCount: unclaimedEntities.length - start,
          totalCount: unclaimedEntities.length,
        },
        'Verifying CHILL claimed batch',
      );

      try {
        const batchResults = await aggregate3StaticLatest(
          context,
          batch.map((entity) => ({
            target: CHILL_ADDRESS,
            allowFailure: true,
            callData: CHILL.functions.getClaimedStatusFor.encode({ tokenId: entity.tokenId }),
          })),
          multicallAddress,
        );
        result.push(...batchResults);
      } catch (error) {
        context.log.warn(
          {
            step: 'HANDLE',
            handler: 'chillClaimed',
            batchIndex,
            batchSize: batch.length,
            error: error instanceof Error ? error.message : String(error),
          },
          'Multicall batch failed for CHILL claimed verification',
        );
        // Skip this batch on error
        batchIndex++;
        continue;
      }

      batchIndex++;

      // Rate limiting: 1 second delay between batches
      if (batchIndex < batchesCount) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Process results and update entities with value=true for claimed NFTs
    unclaimedEntities.forEach((entity, index) => {
      if (
        result[index] &&
        result[index].success &&
        isHex(result[index].returnData) &&
        safeHexToBool(result[index].returnData)
      ) {
        // Update entity value to true
        const updatedEntity = new ChillClaimed({
          ...entity, // Preserves ALL fields including digitalAsset and nft FKs
          value: true, // Override only the field that changed
        });

        batchCtx.addEntity(ENTITY_TYPE, updatedEntity.id, updatedEntity);
        // Note: enrichment is queued in Phase 1 only to avoid duplicate enrichment queue entries.
      }
    });

    context.log.info(
      { step: 'HANDLE', handler: 'chillClaimed', totalChecked: unclaimedEntities.length },
      'CHILL claimed verification complete',
    );
  },
};

export default ChillClaimedHandler;
