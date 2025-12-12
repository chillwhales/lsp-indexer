import { ExtractParams } from '@/types';
import {
  ListingManager,
  PlatformProceedsManager,
  PurchaseManager,
  SellerProceedsManager,
} from '@chillwhales/abi';
import {
  DigitalAsset,
  Listing,
  ListingClosed,
  ListingCreated,
  ListingPaused,
  ListingPriceUpdated,
  ListingStatus,
  ListingUnpaused,
  PlatformProceedsWithdrawn,
  PurchaseCompleted,
  SellerProceedsWithdrawn,
  TokensWithdrawn,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique listing ID from address and listingId
 * This is used to ensure uniqueness across different marketplace contracts
 */
export function generateListingEntityId({
  address,
  listingId,
}: {
  address: string;
  listingId: string;
}): string {
  return `${address}-${listingId}`;
}

// ============================================================================
// Extract functions - Create entities from event logs
// ============================================================================

export function extractListingCreated({ block, log }: ExtractParams): ListingCreated {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { listingId, seller, token, price, marketplaceProfile, amount } =
    ListingManager.events.ListingCreated.decode(log);
  const listingIdStr = listingId.toString();
  const listingEntityId = generateListingEntityId({ address, listingId: listingIdStr });

  return new ListingCreated({
    id: listingEntityId, // Use deterministic ID for uniqueness
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    marketplaceProfile,
    listingId: listingIdStr,
    seller,
    token,
    amount,
    price,
    listingEntity: new Listing({ id: listingEntityId }),
  });
}

export function extractListingClosed({ block, log }: ExtractParams): ListingClosed {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { listingId } = ListingManager.events.ListingClosed.decode(log);
  const listingIdStr = listingId.toString();
  const listingEntityId = generateListingEntityId({ address, listingId: listingIdStr });

  return new ListingClosed({
    id: listingEntityId, // Use deterministic ID for uniqueness
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    listingId: listingIdStr,
    listingEntity: new Listing({ id: listingEntityId }),
  });
}

export function extractListingPaused({ block, log }: ExtractParams): ListingPaused {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { listingId } = ListingManager.events.ListingPaused.decode(log);
  const listingIdStr = listingId.toString();
  const listingEntityId = generateListingEntityId({ address, listingId: listingIdStr });

  return new ListingPaused({
    id: uuidv4(), // Non-unique, use UUID
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    listingId: listingIdStr,
    listingEntity: new Listing({ id: listingEntityId }),
  });
}

export function extractListingUnpaused({ block, log }: ExtractParams): ListingUnpaused {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { listingId } = ListingManager.events.ListingUnpaused.decode(log);
  const listingIdStr = listingId.toString();
  const listingEntityId = generateListingEntityId({ address, listingId: listingIdStr });

  return new ListingUnpaused({
    id: uuidv4(), // Non-unique, use UUID
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    listingId: listingIdStr,
    listingEntity: new Listing({ id: listingEntityId }),
  });
}

export function extractListingPriceUpdated({ block, log }: ExtractParams): ListingPriceUpdated {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { listingId, oldPriceUsd, newPriceUsd } =
    ListingManager.events.ListingPriceUpdated.decode(log);
  const listingIdStr = listingId.toString();
  const listingEntityId = generateListingEntityId({ address, listingId: listingIdStr });

  return new ListingPriceUpdated({
    id: uuidv4(), // Non-unique, use UUID
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    listingId: listingIdStr,
    oldPriceUsd,
    newPriceUsd,
    listingEntity: new Listing({ id: listingEntityId }),
  });
}

export function extractTokensWithdrawn({ block, log }: ExtractParams): TokensWithdrawn {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { listingId, recipient, amount } = ListingManager.events.TokensWithdrawn.decode(log);
  const listingIdStr = listingId.toString();
  const listingEntityId = generateListingEntityId({ address, listingId: listingIdStr });

  return new TokensWithdrawn({
    id: uuidv4(), // Non-unique, use UUID
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    listingId: listingIdStr,
    recipient,
    amount,
    listingEntity: new Listing({ id: listingEntityId }),
  });
}

export function extractPurchaseCompleted({ block, log }: ExtractParams): PurchaseCompleted {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const {
    listingId,
    buyer,
    seller,
    token,
    quantity,
    price,
    paymentToken,
    totalPayment,
    platformFee,
  } = PurchaseManager.events.PurchaseCompleted.decode(log);
  const listingIdStr = listingId.toString();
  const listingEntityId = generateListingEntityId({ address, listingId: listingIdStr });

  return new PurchaseCompleted({
    id: uuidv4(), // Non-unique, use UUID
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    listingId: listingIdStr,
    buyer,
    seller,
    token,
    quantity,
    price,
    paymentToken,
    totalPayment,
    platformFee,
    listingEntity: new Listing({ id: listingEntityId }),
  });
}

export function extractPlatformProceedsWithdrawn({
  block,
  log,
}: ExtractParams): PlatformProceedsWithdrawn {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { marketplaceProfile, paymentToken, recipient, amount } =
    PlatformProceedsManager.events.PlatformProceedsWithdrawn.decode(log);

  return new PlatformProceedsWithdrawn({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    marketplaceProfile,
    recipient,
    paymentToken,
    amount,
  });
}

export function extractSellerProceedsWithdrawn({
  block,
  log,
}: ExtractParams): SellerProceedsWithdrawn {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { marketplaceProfile, seller, paymentToken, recipient, amount } =
    SellerProceedsManager.events.SellerProceedsWithdrawn.decode(log);

  return new SellerProceedsWithdrawn({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    marketplaceProfile,
    seller,
    recipient,
    paymentToken,
    amount,
  });
}

// ============================================================================
// Populate functions - Add relationships to entities
// ============================================================================

export function populateListingCreated({
  listingCreatedEntities,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  listingCreatedEntities: ListingCreated[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}): ListingCreated[] {
  return listingCreatedEntities.map(
    (entity) =>
      new ListingCreated({
        ...entity,
        sellerUniversalProfile: validUniversalProfiles.has(entity.seller)
          ? new UniversalProfile({ id: entity.seller })
          : null,
        tokenDigitalAsset: validDigitalAssets.has(entity.token)
          ? new DigitalAsset({ id: entity.token })
          : null,
      }),
  );
}

export function populateTokensWithdrawn({
  tokensWithdrawnEntities,
  validUniversalProfiles,
}: {
  tokensWithdrawnEntities: TokensWithdrawn[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}): TokensWithdrawn[] {
  return tokensWithdrawnEntities.map(
    (entity) =>
      new TokensWithdrawn({
        ...entity,
        recipientUniversalProfile: validUniversalProfiles.has(entity.recipient)
          ? new UniversalProfile({ id: entity.recipient })
          : null,
      }),
  );
}

export function populatePurchaseCompleted({
  purchaseCompletedEntities,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  purchaseCompletedEntities: PurchaseCompleted[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}): PurchaseCompleted[] {
  return purchaseCompletedEntities.map(
    (entity) =>
      new PurchaseCompleted({
        ...entity,
        buyerUniversalProfile: validUniversalProfiles.has(entity.buyer)
          ? new UniversalProfile({ id: entity.buyer })
          : null,
        sellerUniversalProfile: validUniversalProfiles.has(entity.seller)
          ? new UniversalProfile({ id: entity.seller })
          : null,
        tokenDigitalAsset: validDigitalAssets.has(entity.token)
          ? new DigitalAsset({ id: entity.token })
          : null,
        paymentTokenDigitalAsset: validDigitalAssets.has(entity.paymentToken)
          ? new DigitalAsset({ id: entity.paymentToken })
          : null,
      }),
  );
}

export function populatePlatformProceedsWithdrawn({
  platformProceedsWithdrawnEntities,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  platformProceedsWithdrawnEntities: PlatformProceedsWithdrawn[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}): PlatformProceedsWithdrawn[] {
  return platformProceedsWithdrawnEntities.map(
    (entity) =>
      new PlatformProceedsWithdrawn({
        ...entity,
        recipientUniversalProfile: validUniversalProfiles.has(entity.recipient)
          ? new UniversalProfile({ id: entity.recipient })
          : null,
        paymentTokenDigitalAsset: validDigitalAssets.has(entity.paymentToken)
          ? new DigitalAsset({ id: entity.paymentToken })
          : null,
      }),
  );
}

export function populateSellerProceedsWithdrawn({
  sellerProceedsWithdrawnEntities,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  sellerProceedsWithdrawnEntities: SellerProceedsWithdrawn[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}): SellerProceedsWithdrawn[] {
  return sellerProceedsWithdrawnEntities.map(
    (entity) =>
      new SellerProceedsWithdrawn({
        ...entity,
        sellerUniversalProfile: validUniversalProfiles.has(entity.seller)
          ? new UniversalProfile({ id: entity.seller })
          : null,
        recipientUniversalProfile: validUniversalProfiles.has(entity.recipient)
          ? new UniversalProfile({ id: entity.recipient })
          : null,
        paymentTokenDigitalAsset: validDigitalAssets.has(entity.paymentToken)
          ? new DigitalAsset({ id: entity.paymentToken })
          : null,
      }),
  );
}

// ============================================================================
// Listing entity creation from events
// ============================================================================

export function createListingFromCreatedEvent({
  listingCreatedEntity,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  listingCreatedEntity: ListingCreated;
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}): Listing {
  return new Listing({
    id: listingCreatedEntity.listingEntity.id,
    listingId: listingCreatedEntity.listingId,
    address: listingCreatedEntity.address,
    marketplaceProfile: listingCreatedEntity.marketplaceProfile,
    seller: listingCreatedEntity.seller,
    sellerUniversalProfile: validUniversalProfiles.has(listingCreatedEntity.seller)
      ? new UniversalProfile({ id: listingCreatedEntity.seller })
      : null,
    token: listingCreatedEntity.token,
    tokenDigitalAsset: validDigitalAssets.has(listingCreatedEntity.token)
      ? new DigitalAsset({ id: listingCreatedEntity.token })
      : null,
    amount: listingCreatedEntity.amount,
    price: listingCreatedEntity.price,
    status: ListingStatus.ACTIVE,
    createdAt: listingCreatedEntity.timestamp,
    updatedAt: listingCreatedEntity.timestamp,
  });
}
