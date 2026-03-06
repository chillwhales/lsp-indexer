/**
 * LSP4Metadata Base URI derivation handler.
 *
 * Creates per-token LSP4Metadata entities by combining LSP8TokenMetadataBaseURI
 * with NFT tokenIds. Two trigger paths:
 *   1. On mint (LSP8Transfer from zero): check if parent collection has base URI
 *   2. On base URI change (LSP8TokenMetadataBaseURI): create metadata for ALL existing NFTs
 *
 * Closes GAP-06 (~84K missing LSP4Metadata entities). Created entities are
 * automatically fetched by the existing lsp4MetadataFetch handler.
 *
 * Port from v1:
 *   - utils/lsp4MetadataBaseUri.ts (extractFromBaseUri, extractFromMints)
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { LSP4Metadata, LSP8TokenMetadataBaseURI, NFT, Transfer } from '@chillwhales/typeorm';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

// Entity type keys
const LSP4_ENTITY_TYPE = 'LSP4Metadata';
const NFT_ENTITY_TYPE = 'NFT';
const BASE_URI_ENTITY_TYPE = 'LSP8TokenMetadataBaseURI';
const TRANSFER_ENTITY_TYPE = 'LSP8Transfer';

const LSP4MetadataBaseUriHandler: EntityHandler = {
  name: 'lsp4MetadataBaseUri',
  listensToBag: ['LSP8Transfer', 'LSP8TokenMetadataBaseURI'],
  dependsOn: ['lsp8MetadataBaseURI', 'nft', 'formattedTokenId'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    if (triggeredBy === BASE_URI_ENTITY_TYPE) {
      await handleBaseUriChanged(hctx);
    } else if (triggeredBy === TRANSFER_ENTITY_TYPE) {
      await handleMints(hctx);
    }
  },
};

// ---------------------------------------------------------------------------
// Path 1: Base URI changed — derive URLs for ALL existing NFTs
// ---------------------------------------------------------------------------

async function handleBaseUriChanged(hctx: HandlerContext): Promise<void> {
  // Get all LSP8TokenMetadataBaseURI entities from batch
  const baseUriEntities = hctx.batchCtx.getEntities<LSP8TokenMetadataBaseURI>(BASE_URI_ENTITY_TYPE);
  if (baseUriEntities.size === 0) return;

  // Collect unique addresses
  const addresses = [...new Set([...baseUriEntities.values()].map((e) => e.address))];

  // Load ALL NFTs for those addresses from DB
  // NOTE: Uses address-based query (not ID-based), so resolveEntities is not applicable.
  // We need ALL NFTs for each contract address to derive metadata URLs.
  const dbNFTs = await hctx.store.findBy(NFT, { address: In(addresses) });
  const nfts = new Map<string, NFT>(dbNFTs.map((nft) => [nft.id, nft]));

  // Also check NFTs in current batch (may have mints in same batch as base URI change)
  const batchNFTs = hctx.batchCtx.getEntities<NFT>(NFT_ENTITY_TYPE);
  for (const [id, nft] of batchNFTs) {
    nfts.set(id, nft); // Batch takes priority
  }

  // Deduplication map
  const lsp4MetadataMap = new Map<string, LSP4Metadata>();

  // For each base URI entity, find all NFTs with matching address
  for (const baseUriEntity of baseUriEntities.values()) {
    const { address, value, rawValue, timestamp } = baseUriEntity;

    // Filter NFTs for this contract
    const contractNFTs = [...nfts.values()].filter(
      (nft) => nft.address.toLowerCase() === address.toLowerCase(),
    );

    for (const nft of contractNFTs) {
      const entityId = `BaseURI - ${generateTokenId({ address, tokenId: nft.tokenId })}`;

      // Derive URL: baseUri.endsWith('/') ? baseUri + formattedTokenId : baseUri + '/' + formattedTokenId
      // Use formattedTokenId when available, fall back to raw tokenId (V1 behavior at line 103-106)
      const tokenIdForUrl = nft.formattedTokenId ?? nft.tokenId;
      const url =
        value !== null
          ? value.endsWith('/')
            ? `${value}${tokenIdForUrl}`
            : `${value}/${tokenIdForUrl}`
          : null;

      const entity = new LSP4Metadata({
        id: entityId,
        address,
        timestamp,
        tokenId: nft.tokenId,
        url,
        rawValue,
        isDataFetched: false,
        retryCount: 0,
        digitalAsset: null, // FK resolved via enrichment
        nft: null, // FK resolved via enrichment
      });

      lsp4MetadataMap.set(entityId, entity);
    }
  }

  // Add all entities to batch
  for (const [id, entity] of lsp4MetadataMap) {
    hctx.batchCtx.addEntity(LSP4_ENTITY_TYPE, id, entity);

    // Queue enrichment for digitalAsset FK
    hctx.batchCtx.queueEnrichment<LSP4Metadata>({
      category: EntityCategory.DigitalAsset,
      address: entity.address,
      entityType: LSP4_ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
    });

    // Queue enrichment for nft FK
    hctx.batchCtx.queueEnrichment<LSP4Metadata>({
      category: EntityCategory.NFT,
      address: entity.address,
      tokenId: entity.tokenId,
      entityType: LSP4_ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'nft',
    });
  }
}

// ---------------------------------------------------------------------------
// Path 2: New mints — check if parent collection has base URI
// ---------------------------------------------------------------------------

async function handleMints(hctx: HandlerContext): Promise<void> {
  // Get all LSP8Transfer entities
  const transfers = hctx.batchCtx.getEntities<Transfer>(TRANSFER_ENTITY_TYPE);

  // Filter to mints only (from zero address AND has tokenId — LSP8 only)
  const mints: Transfer[] = [];
  for (const transfer of transfers.values()) {
    if (
      isAddressEqual(getAddress(transfer.from), zeroAddress) &&
      transfer.tokenId !== null &&
      transfer.tokenId !== undefined
    ) {
      mints.push(transfer);
    }
  }

  if (mints.length === 0) return;

  // Collect unique contract addresses from mints
  const addresses = [...new Set(mints.map((m) => m.address))];

  // Load LSP8TokenMetadataBaseURI from DB for those addresses
  // NOTE: Uses address-based query (not ID-based), so resolveEntities is not applicable.
  // LSP8TokenMetadataBaseURI entities are queried by address field, not by id field.
  const dbBaseURIs = await hctx.store.findBy(LSP8TokenMetadataBaseURI, {
    address: In(addresses),
  });
  const baseURIs = new Map<string, LSP8TokenMetadataBaseURI>(
    dbBaseURIs.map((uri) => [uri.address.toLowerCase(), uri]),
  );

  // Also check batch for LSP8TokenMetadataBaseURI entities
  const batchBaseURIs = hctx.batchCtx.getEntities<LSP8TokenMetadataBaseURI>(BASE_URI_ENTITY_TYPE);
  for (const [_, uri] of batchBaseURIs) {
    baseURIs.set(uri.address.toLowerCase(), uri); // Batch takes priority
  }

  // Deduplication map
  const lsp4MetadataMap = new Map<string, LSP4Metadata>();

  // For each mint that has a matching base URI
  for (const mint of mints) {
    const addressKey = mint.address.toLowerCase();
    const baseUri = baseURIs.get(addressKey);

    if (!baseUri) continue; // No base URI for this collection

    // Look up NFT entity from batch to get formattedTokenId
    const nftId = generateTokenId({ address: mint.address, tokenId: mint.tokenId });
    const nft = hctx.batchCtx.getEntities<NFT>(NFT_ENTITY_TYPE).get(nftId);

    // Use formattedTokenId when available, fall back to raw tokenId
    const tokenIdForUrl = nft?.formattedTokenId ?? mint.tokenId;

    // Derive URL
    const url =
      baseUri.value !== null
        ? baseUri.value.endsWith('/')
          ? `${baseUri.value}${tokenIdForUrl}`
          : `${baseUri.value}/${tokenIdForUrl}`
        : null;

    const entityId = `BaseURI - ${nftId}`;

    const entity = new LSP4Metadata({
      id: entityId,
      address: mint.address,
      timestamp: baseUri.timestamp,
      tokenId: mint.tokenId,
      url,
      rawValue: baseUri.rawValue,
      isDataFetched: false,
      retryCount: 0,
      digitalAsset: null, // FK resolved via enrichment
      nft: null, // FK resolved via enrichment
    });

    lsp4MetadataMap.set(entityId, entity);
  }

  // Add all entities to batch
  for (const [id, entity] of lsp4MetadataMap) {
    hctx.batchCtx.addEntity(LSP4_ENTITY_TYPE, id, entity);

    // Queue enrichment for digitalAsset FK
    hctx.batchCtx.queueEnrichment<LSP4Metadata>({
      category: EntityCategory.DigitalAsset,
      address: entity.address,
      entityType: LSP4_ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
    });

    // Queue enrichment for nft FK
    hctx.batchCtx.queueEnrichment<LSP4Metadata>({
      category: EntityCategory.NFT,
      address: entity.address,
      tokenId: entity.tokenId,
      entityType: LSP4_ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'nft',
    });
  }
}

export default LSP4MetadataBaseUriHandler;
