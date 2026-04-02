/**
 * LSP4Metadata entity handler.
 *
 * Subscribes to both DataChanged and TokenIdDataChanged events and creates
 * LSP4Metadata entities for events matching the LSP4Metadata data key. Decodes
 * the VerifiableURI from the data value to get a metadata URL.
 *
 * DataChanged events create LSP4Metadata with id = address (contract-level metadata).
 * TokenIdDataChanged events create LSP4Metadata with id = "{address} - {tokenId}"
 * (per-token metadata on LSP8 contracts).
 *
 * The metadata fetch handler (issue #54) will later fetch the URL and populate
 * sub-entities (names, descriptions, images, etc.). This handler only creates
 * the main LSP4Metadata entity with `isDataFetched: false`.
 *
 * Note: clearSubEntities logic is deferred to the metadata fetch handler since
 * that handler re-creates the sub-entities.
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { decodeVerifiableUri, generateTokenId, prefixId } from '@/utils';
import { LSP4Metadata } from '@/model';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4Metadata';

const LSP4_METADATA_KEY: string = LSP4DataKeys.LSP4Metadata;

const LSP4MetadataHandler: EntityHandler = {
  name: 'lsp4Metadata',
  supportedChains: ['lukso', 'ethereum', 'ethereum-sepolia'],
  listensToBag: ['DataChanged', 'TokenIdDataChanged'],

  handle(hctx, triggeredBy): void {
    if (triggeredBy === 'DataChanged') {
      handleDataChanged(hctx);
    } else if (triggeredBy === 'TokenIdDataChanged') {
      handleTokenIdDataChanged(hctx);
    }
  },
};

// ---------------------------------------------------------------------------
// Handle DataChanged events (contract-level metadata)
// ---------------------------------------------------------------------------

function handleDataChanged(hctx: HandlerContext): void {
  const events = hctx.batchCtx.getEntities('DataChanged');

  for (const event of events.values()) {
    // Filter by data key
    if (event.dataKey !== LSP4_METADATA_KEY) continue;

    // Decode VerifiableURI
    const { value: url, decodeError } = decodeVerifiableUri(event.dataValue);

    // Create entity (id = address)
    const entity = new LSP4Metadata({
      id: prefixId(hctx.batchCtx.network, event.address),
      network: hctx.batchCtx.network,
      address: event.address,
      timestamp: event.timestamp,
      blockNumber: event.blockNumber,
      transactionIndex: event.transactionIndex,
      logIndex: event.logIndex,
      url,
      rawValue: event.dataValue,
      decodeError,
      isDataFetched: false,
      retryCount: 0,
      digitalAsset: null, // FK initially null
    });

    // Add to BatchContext
    hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for digitalAsset FK
    hctx.batchCtx.queueEnrichment<LSP4Metadata>({
      category: EntityCategory.DigitalAsset,
      address: event.address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
      blockNumber: event.blockNumber,
      transactionIndex: event.transactionIndex,
      logIndex: event.logIndex,
      timestamp: event.timestamp.getTime(),
    });
  }
}

// ---------------------------------------------------------------------------
// Handle TokenIdDataChanged events (per-token metadata)
// ---------------------------------------------------------------------------

function handleTokenIdDataChanged(hctx: HandlerContext): void {
  const events = hctx.batchCtx.getEntities('TokenIdDataChanged');

  for (const event of events.values()) {
    // Filter by data key
    if (event.dataKey !== LSP4_METADATA_KEY) continue;

    // Decode VerifiableURI
    const { value: url, decodeError } = decodeVerifiableUri(event.dataValue);

    // Generate NFT id
    const nftId = generateTokenId({ network: hctx.batchCtx.network, address: event.address, tokenId: event.tokenId });

    // Create entity (id = "{address} - {tokenId}")
    const entity = new LSP4Metadata({
      id: nftId,
      network: hctx.batchCtx.network,
      address: event.address,
      timestamp: event.timestamp,
      blockNumber: event.blockNumber,
      transactionIndex: event.transactionIndex,
      logIndex: event.logIndex,
      tokenId: event.tokenId,
      nft: null, // FK initially null
      url,
      rawValue: event.dataValue,
      decodeError,
      isDataFetched: false,
      retryCount: 0,
      digitalAsset: null, // FK initially null
    });

    // Add to BatchContext
    hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for digitalAsset FK
    hctx.batchCtx.queueEnrichment<LSP4Metadata>({
      category: EntityCategory.DigitalAsset,
      address: event.address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
      blockNumber: event.blockNumber,
      transactionIndex: event.transactionIndex,
      logIndex: event.logIndex,
      timestamp: event.timestamp.getTime(),
    });

    // Queue enrichment for nft FK
    hctx.batchCtx.queueEnrichment<LSP4Metadata>({
      category: EntityCategory.NFT,
      address: event.address,
      tokenId: event.tokenId,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'nft',
      blockNumber: event.blockNumber,
      transactionIndex: event.transactionIndex,
      logIndex: event.logIndex,
      timestamp: event.timestamp.getTime(),
    });
  }
}

export default LSP4MetadataHandler;
