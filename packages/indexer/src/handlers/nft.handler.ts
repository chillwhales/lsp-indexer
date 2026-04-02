/**
 * NFT entity handler.
 *
 * Subscribes to LSP8Transfer and TokenIdDataChanged events and creates NFT
 * entities with deterministic ids. Sets isMinted/isBurned flags based on
 * Transfer mint/burn events. Queues enrichment for digitalAsset FK.
 *
 * NFT entity creation priority:
 *   1. LSP8Transfer (mint/burn) — creates NFT with isMinted or isBurned flag
 *   2. TokenIdDataChanged — creates NFT stub only if not already in batch
 *
 * The formattedTokenId field is left null — formatting is handled by the
 * FormattedTokenId handler (issue #113) which runs after NFT creation.
 */
import { ZERO_ADDRESS } from '@/constants';
import { resolveEntities } from '@/core/handlerHelpers';
import { EntityCategory, EntityHandler } from '@/core/types';
import { NFT } from '@/model';
import { generateTokenId } from '@/utils';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'NFT';

// Lowercase zero address once for performance
const ZERO_ADDRESS_LOWER = ZERO_ADDRESS.toLowerCase();

const NFTHandler: EntityHandler = {
  name: 'nft',
  supportedChains: ['lukso', 'lukso-testnet'],
  listensToBag: ['LSP8Transfer', 'TokenIdDataChanged'],

  async handle(hctx, triggeredBy): Promise<void> {
    // Start with NFTs already created in this batch (intra-batch deduplication)
    const existingInBatch = hctx.batchCtx.getEntities('NFT');
    const nfts = new Map<string, NFT>(existingInBatch);

    // Process LSP8Transfer first (higher priority for mint/burn status)
    if (triggeredBy === 'LSP8Transfer') {
      const transfers = hctx.batchCtx.getEntities('LSP8Transfer');

      for (const transfer of transfers.values()) {
        const nftId = generateTokenId({ address: transfer.address, tokenId: transfer.tokenId });

        // Mint event: from === zero address
        if (transfer.from.toLowerCase() === ZERO_ADDRESS_LOWER) {
          nfts.set(
            nftId,
            new NFT({
              id: nftId,
              tokenId: transfer.tokenId,
              address: transfer.address,
              timestamp: transfer.timestamp,
              blockNumber: transfer.blockNumber,
              transactionIndex: transfer.transactionIndex,
              logIndex: transfer.logIndex,
              formattedTokenId: null, // Populated by FormattedTokenId handler (issue #113)
              digitalAsset: null, // FK resolved via enrichment
              isMinted: true,
              isBurned: false,
            }),
          );
        }
        // Burn event: to === zero address
        else if (transfer.to.toLowerCase() === ZERO_ADDRESS_LOWER) {
          nfts.set(
            nftId,
            new NFT({
              id: nftId,
              tokenId: transfer.tokenId,
              address: transfer.address,
              timestamp: transfer.timestamp,
              blockNumber: transfer.blockNumber,
              transactionIndex: transfer.transactionIndex,
              logIndex: transfer.logIndex,
              formattedTokenId: null, // Populated by FormattedTokenId handler (issue #113)
              digitalAsset: null, // FK resolved via enrichment
              isMinted: false,
              isBurned: true,
            }),
          );
        }
      }
    }

    // Process TokenIdDataChanged (creates stubs only if not already in batch or database)
    //
    // Resolve from batch + DB to avoid overwriting existing NFTs with stubs.
    // This ensures we preserve mint/burn flags from previous batches.
    if (triggeredBy === 'TokenIdDataChanged') {
      const events = hctx.batchCtx.getEntities('TokenIdDataChanged');

      // Collect potential NFT IDs from TokenIdDataChanged events
      const potentialNewIds: string[] = [];
      for (const event of events.values()) {
        const nftId = generateTokenId({ address: event.address, tokenId: event.tokenId });
        potentialNewIds.push(nftId);
      }

      // Resolve NFTs from batch + DB
      const existingNFTs = await resolveEntities(
        hctx.store,
        hctx.batchCtx,
        ENTITY_TYPE,
        potentialNewIds,
      );

      // Create stubs only for NFTs that don't exist in either source
      for (const event of events.values()) {
        const nftId = generateTokenId({ address: event.address, tokenId: event.tokenId });

        if (!existingNFTs.has(nftId)) {
          nfts.set(
            nftId,
            new NFT({
              id: nftId,
              tokenId: event.tokenId,
              address: event.address,
              timestamp: event.timestamp,
              blockNumber: event.blockNumber,
              transactionIndex: event.transactionIndex,
              logIndex: event.logIndex,
              formattedTokenId: null, // Populated by FormattedTokenId handler (issue #113)
              digitalAsset: null, // FK resolved via enrichment
              isMinted: false,
              isBurned: false,
            }),
          );
        }
      }
    }

    // Early return if no NFTs were created
    if (nfts.size === 0) return;

    // Queue enrichment for digitalAsset FK on all NFTs
    for (const nft of nfts.values()) {
      hctx.batchCtx.queueEnrichment<NFT>({
        category: EntityCategory.DigitalAsset,
        address: nft.address,
        entityType: ENTITY_TYPE,
        entityId: nft.id,
        fkField: 'digitalAsset',
        blockNumber: nft.blockNumber,
        transactionIndex: nft.transactionIndex,
        logIndex: nft.logIndex,
        timestamp: nft.timestamp.getTime(),
      });

      hctx.batchCtx.addEntity(ENTITY_TYPE, nft.id, nft);
    }
  },
};

export default NFTHandler;
