/**
 * OrbsClaimed entity handler (ChillWhales-specific).
 *
 * Subscribes to LSP8Transfer events and creates OrbsClaimed entities in two phases:
 * 1. On mint transfers (from zero address to CHILLWHALES_ADDRESS), create entities with value=false
 * 2. At chain head (isHead=true), verify Orbs claimed status via ORBS contract Multicall3, update value=true
 *
 * Produces a single entity type:
 *   - `OrbsClaimed` — tracks which Chillwhale NFTs have claimed their Orbs
 *
 * Phase 1 runs on every batch. Phase 2 only runs at chain head to avoid wasteful RPC calls.
 *
 * **Key difference from ChillClaimed:** Uses ORBS contract and getChillwhaleClaimStatus function
 * instead of CHILL contract and getClaimedStatusFor.
 */
import { CHILLWHALES_ADDRESS, ORBS_ADDRESS } from '@/constants/chillwhales';
import { aggregate3StaticLatest } from '@/core/multicall';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateTokenId, isNullAddress } from '@/utils';
import { ORBS } from '@chillwhales/abi';
import { Aggregate3StaticReturn } from '@chillwhales/abi/lib/abi/Multicall3';
import { OrbsClaimed, Transfer } from '@chillwhales/typeorm';
import { getAddress, hexToBool, isAddressEqual, isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'OrbsClaimed';

// Multicall batch size
const BATCH_SIZE = 500;

const OrbsClaimedHandler: EntityHandler = {
  name: 'orbsClaimed',
  listensToBag: ['LSP8Transfer'],
  postVerification: false,

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    const { context, batchCtx, isHead, store } = hctx;

    // PHASE 1: Mint detection (runs every batch)
    // Filter LSP8Transfer events to Chillwhale mints (from zero address to CHILLWHALES_ADDRESS)
    const events = batchCtx.getEntities<Transfer>(triggeredBy);
    const mintTransfers: Transfer[] = [];

    for (const event of events.values()) {
      if (
        isAddressEqual(getAddress(event.address), CHILLWHALES_ADDRESS) &&
        isNullAddress(event.from)
      ) {
        mintTransfers.push(event);
      }
    }

    // Create OrbsClaimed entities for new mints
    if (mintTransfers.length > 0) {
      for (const event of mintTransfers) {
        const id = generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId: event.tokenId });

        const entity = new OrbsClaimed({
          id,
          address: CHILLWHALES_ADDRESS,
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
        batchCtx.queueEnrichment<OrbsClaimed>({
          category: EntityCategory.DigitalAsset,
          address: CHILLWHALES_ADDRESS,
          entityType: ENTITY_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
          blockNumber: event.blockNumber,
          transactionIndex: event.transactionIndex,
          logIndex: event.logIndex,
        });

        // Queue enrichment for nft FK
        batchCtx.queueEnrichment<OrbsClaimed>({
          category: EntityCategory.NFT,
          address: CHILLWHALES_ADDRESS,
          tokenId: event.tokenId,
          entityType: ENTITY_TYPE,
          entityId: id,
          fkField: 'nft',
          blockNumber: event.blockNumber,
          transactionIndex: event.transactionIndex,
          logIndex: event.logIndex,
        });
      }
    }

    // PHASE 2: On-chain verification (runs at chain head only)
    if (!isHead) return;

    // Query database for unclaimed OrbsClaimed entities (value=false)
    const unclaimedEntities = await store.findBy(OrbsClaimed, { value: false });

    if (unclaimedEntities.length === 0) return;

    context.log.info(
      JSON.stringify({
        message: 'Verifying ORBS claimed status',
        totalCount: unclaimedEntities.length,
      }),
    );

    // Batch multicall to ORBS contract
    const result: Aggregate3StaticReturn = [];
    let batchIndex = 0;
    const batchesCount = Math.ceil(unclaimedEntities.length / BATCH_SIZE);

    while (batchIndex < batchesCount) {
      const start = batchIndex * BATCH_SIZE;
      const batch = unclaimedEntities.slice(start, start + BATCH_SIZE);

      context.log.info(
        JSON.stringify({
          message: 'Verifying ORBS claimed batch',
          batchIndex,
          batchSize: batch.length,
          verifiedCount: start,
          unverifiedCount: unclaimedEntities.length - start,
          totalCount: unclaimedEntities.length,
        }),
      );

      try {
        const batchResults = await aggregate3StaticLatest(
          context,
          batch.map((entity) => ({
            target: ORBS_ADDRESS,
            allowFailure: true,
            callData: ORBS.functions.getChillwhaleClaimStatus.encode({ tokenId: entity.tokenId }),
          })),
        );
        result.push(...batchResults);
      } catch (error) {
        context.log.warn(
          JSON.stringify({
            message: 'Multicall batch failed for ORBS claimed verification',
            batchIndex,
            batchSize: batch.length,
            error: error instanceof Error ? error.message : String(error),
          }),
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
        hexToBool(result[index].returnData)
      ) {
        // Update entity value to true
        const updatedEntity = new OrbsClaimed({
          ...entity, // Preserves ALL fields including digitalAsset and nft FKs
          value: true, // Override only the field that changed
        });

        batchCtx.addEntity(ENTITY_TYPE, updatedEntity.id, updatedEntity);
        // Note: enrichment is queued in Phase 1 only to avoid duplicate enrichment queue entries.
      }
    });

    context.log.info(
      JSON.stringify({
        message: 'ORBS claimed verification complete',
        totalChecked: unclaimedEntities.length,
      }),
    );
  },
};

export default OrbsClaimedHandler;
