import { Context } from '@/types';
import * as Utils from '@/utils';
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
import { In } from 'typeorm';

type ListingEvent =
  | ListingCreated
  | ListingClosed
  | ListingPaused
  | ListingUnpaused
  | ListingPriceUpdated;

function compareEvents(a: ListingEvent, b: ListingEvent): number {
  if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
  if (a.transactionIndex !== b.transactionIndex) return a.transactionIndex - b.transactionIndex;
  return a.logIndex - b.logIndex;
}

export async function marketplaceHandler({
  context,
  listingCreatedEntities,
  listingClosedEntities,
  listingPausedEntities,
  listingUnpausedEntities,
  listingPriceUpdatedEntities,
  tokensWithdrawnEntities,
  purchaseCompletedEntities,
  platformProceedsWithdrawnEntities,
  sellerProceedsWithdrawnEntities,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  context: Context;
  listingCreatedEntities: ListingCreated[];
  listingClosedEntities: ListingClosed[];
  listingPausedEntities: ListingPaused[];
  listingUnpausedEntities: ListingUnpaused[];
  listingPriceUpdatedEntities: ListingPriceUpdated[];
  tokensWithdrawnEntities: TokensWithdrawn[];
  purchaseCompletedEntities: PurchaseCompleted[];
  platformProceedsWithdrawnEntities: PlatformProceedsWithdrawn[];
  sellerProceedsWithdrawnEntities: SellerProceedsWithdrawn[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  // Populate event entities with relationships
  const populatedListingCreatedEntities = Utils.Marketplace.populateListingCreated({
    listingCreatedEntities,
    validUniversalProfiles,
    validDigitalAssets,
  });

  const populatedTokensWithdrawnEntities = Utils.Marketplace.populateTokensWithdrawn({
    tokensWithdrawnEntities,
    validUniversalProfiles,
  });

  const populatedPurchaseCompletedEntities = Utils.Marketplace.populatePurchaseCompleted({
    purchaseCompletedEntities,
    validUniversalProfiles,
    validDigitalAssets,
  });

  const populatedPlatformProceedsWithdrawnEntities =
    Utils.Marketplace.populatePlatformProceedsWithdrawn({
      platformProceedsWithdrawnEntities,
      validUniversalProfiles,
      validDigitalAssets,
    });

  const populatedSellerProceedsWithdrawnEntities =
    Utils.Marketplace.populateSellerProceedsWithdrawn({
      sellerProceedsWithdrawnEntities,
      validUniversalProfiles,
      validDigitalAssets,
    });

  // Collect all listing IDs that need to be fetched or created
  const listingIdsFromEvents = new Set<string>([
    ...listingCreatedEntities.map((e) => e.listingEntity.id),
    ...listingClosedEntities.map((e) => e.listingEntity.id),
    ...listingPausedEntities.map((e) => e.listingEntity.id),
    ...listingUnpausedEntities.map((e) => e.listingEntity.id),
    ...listingPriceUpdatedEntities.map((e) => e.listingEntity.id),
    ...tokensWithdrawnEntities.map((e) => e.listingEntity.id),
    ...purchaseCompletedEntities.map((e) => e.listingEntity.id),
  ]);

  // Fetch existing listings from database
  const existingListings = new Map(
    await context.store
      .findBy(Listing, {
        id: In([...listingIdsFromEvents]),
      })
      .then((entities) => entities.map((entity) => [entity.id, entity])),
  );

  // Combine all listing events and sort chronologically
  const allListingEvents: ListingEvent[] = [
    ...populatedListingCreatedEntities,
    ...listingClosedEntities,
    ...listingPausedEntities,
    ...listingUnpausedEntities,
    ...listingPriceUpdatedEntities,
  ].sort(compareEvents);

  const updatedListings = new Map<string, Listing>();

  // Process all events chronologically
  for (const event of allListingEvents) {
    const listingId = event.listingEntity.id;

    if (event instanceof ListingCreated) {
      updatedListings.set(
        listingId,
        Utils.Marketplace.createListingFromCreatedEvent({
          listingCreatedEntity: event,
          validUniversalProfiles,
          validDigitalAssets,
        }),
      );
      continue;
    }

    const listing = updatedListings.get(listingId) || existingListings.get(listingId);
    if (!listing) continue;

    if (event instanceof ListingClosed) {
      updatedListings.set(
        listingId,
        new Listing({
          ...listing,
          status: ListingStatus.CLOSED,
          closedAt: event.timestamp,
          updatedAt: event.timestamp,
        }),
      );
    } else if (event instanceof ListingPaused) {
      updatedListings.set(
        listingId,
        new Listing({
          ...listing,
          status: ListingStatus.PAUSED,
          updatedAt: event.timestamp,
        }),
      );
    } else if (event instanceof ListingUnpaused) {
      updatedListings.set(
        listingId,
        new Listing({
          ...listing,
          status: ListingStatus.ACTIVE,
          updatedAt: event.timestamp,
        }),
      );
    } else if (event instanceof ListingPriceUpdated) {
      updatedListings.set(
        listingId,
        new Listing({
          ...listing,
          price: event.newPriceUsd,
          updatedAt: event.timestamp,
        }),
      );
    }
  }

  // Save all updated Listing entities
  if (updatedListings.size) {
    context.log.info(
      JSON.stringify({
        message: "Saving new & updated 'Listing' entities.",
        ListingEntitiesCount: updatedListings.size,
      }),
    );

    await context.store.upsert([...updatedListings.values()]);
  }

  // Create a combined map of all listings for marketplaceProfile lookup and validation
  const allListings = new Map([...existingListings, ...updatedListings]);

  // Filter out events whose Listing doesn't exist (from old ABI) and populate marketplaceProfile
  const validListingClosedEntities = listingClosedEntities
    .filter((entity) => allListings.has(entity.listingEntity.id))
    .map(
      (entity) =>
        new ListingClosed({
          ...entity,
          marketplaceProfile: allListings.get(entity.listingEntity.id)!.marketplaceProfile,
        }),
    );

  const validListingPausedEntities = listingPausedEntities
    .filter((entity) => allListings.has(entity.listingEntity.id))
    .map(
      (entity) =>
        new ListingPaused({
          ...entity,
          marketplaceProfile: allListings.get(entity.listingEntity.id)!.marketplaceProfile,
        }),
    );

  const validListingUnpausedEntities = listingUnpausedEntities
    .filter((entity) => allListings.has(entity.listingEntity.id))
    .map(
      (entity) =>
        new ListingUnpaused({
          ...entity,
          marketplaceProfile: allListings.get(entity.listingEntity.id)!.marketplaceProfile,
        }),
    );

  const validListingPriceUpdatedEntities = listingPriceUpdatedEntities
    .filter((entity) => allListings.has(entity.listingEntity.id))
    .map(
      (entity) =>
        new ListingPriceUpdated({
          ...entity,
          marketplaceProfile: allListings.get(entity.listingEntity.id)!.marketplaceProfile,
        }),
    );

  const validTokensWithdrawnEntities = populatedTokensWithdrawnEntities
    .filter((entity) => allListings.has(entity.listingEntity.id))
    .map(
      (entity) =>
        new TokensWithdrawn({
          ...entity,
          marketplaceProfile: allListings.get(entity.listingEntity.id)!.marketplaceProfile,
        }),
    );

  const validPurchaseCompletedEntities = populatedPurchaseCompletedEntities
    .filter((entity) => allListings.has(entity.listingEntity.id))
    .map(
      (entity) =>
        new PurchaseCompleted({
          ...entity,
          marketplaceProfile: allListings.get(entity.listingEntity.id)!.marketplaceProfile,
        }),
    );

  // Save populated event entities
  const eventSavePromises = [];

  if (populatedListingCreatedEntities.length) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'ListingCreated' events.",
        ListingCreatedEntitiesCount: populatedListingCreatedEntities.length,
      }),
    );
    eventSavePromises.push(context.store.upsert(populatedListingCreatedEntities));
  }

  if (validListingClosedEntities.length) {
    eventSavePromises.push(context.store.upsert(validListingClosedEntities));
  }

  if (validListingPausedEntities.length) {
    eventSavePromises.push(context.store.insert(validListingPausedEntities));
  }

  if (validListingUnpausedEntities.length) {
    eventSavePromises.push(context.store.insert(validListingUnpausedEntities));
  }

  if (validListingPriceUpdatedEntities.length) {
    eventSavePromises.push(context.store.insert(validListingPriceUpdatedEntities));
  }

  if (validTokensWithdrawnEntities.length) {
    eventSavePromises.push(context.store.insert(validTokensWithdrawnEntities));
  }

  if (validPurchaseCompletedEntities.length) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'PurchaseCompleted' events.",
        PurchaseCompletedEntitiesCount: validPurchaseCompletedEntities.length,
      }),
    );
    eventSavePromises.push(context.store.insert(validPurchaseCompletedEntities));
  }

  if (populatedPlatformProceedsWithdrawnEntities.length) {
    eventSavePromises.push(context.store.insert(populatedPlatformProceedsWithdrawnEntities));
  }

  if (populatedSellerProceedsWithdrawnEntities.length) {
    eventSavePromises.push(context.store.insert(populatedSellerProceedsWithdrawnEntities));
  }

  await Promise.all(eventSavePromises);
}
