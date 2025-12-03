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

  if (listingClosedEntities.length) {
    eventSavePromises.push(context.store.upsert(listingClosedEntities));
  }

  if (listingPausedEntities.length) {
    eventSavePromises.push(context.store.insert(listingPausedEntities));
  }

  if (listingUnpausedEntities.length) {
    eventSavePromises.push(context.store.insert(listingUnpausedEntities));
  }

  if (listingPriceUpdatedEntities.length) {
    eventSavePromises.push(context.store.insert(listingPriceUpdatedEntities));
  }

  if (populatedTokensWithdrawnEntities.length) {
    eventSavePromises.push(context.store.insert(populatedTokensWithdrawnEntities));
  }

  if (populatedPurchaseCompletedEntities.length) {
    context.log.info(
      JSON.stringify({
        message: "Saving 'PurchaseCompleted' events.",
        PurchaseCompletedEntitiesCount: populatedPurchaseCompletedEntities.length,
      }),
    );
    eventSavePromises.push(context.store.insert(populatedPurchaseCompletedEntities));
  }

  if (populatedPlatformProceedsWithdrawnEntities.length) {
    eventSavePromises.push(context.store.insert(populatedPlatformProceedsWithdrawnEntities));
  }

  if (populatedSellerProceedsWithdrawnEntities.length) {
    eventSavePromises.push(context.store.insert(populatedSellerProceedsWithdrawnEntities));
  }

  await Promise.all(eventSavePromises);
}
