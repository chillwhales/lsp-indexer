import {
  NetworkIdSchema,
  type SubscriptionHookOptions,
  type SubscriptionInstance,
  type V3Block,
  type V3ChillwhalesNft,
  type V3Controller,
  type V3Creator,
  type V3DataValue,
  type V3DigitalAsset,
  type V3Domain,
  type V3DomainResultMap,
  type V3EventFact,
  type V3Follower,
  type V3IndexedHead,
  type V3IssuedAsset,
  type V3ListParams,
  type V3ListResult,
  type V3MetadataRevision,
  type V3Nft,
  type V3OwnedAsset,
  type V3OwnedToken,
  type V3UniversalProfile,
} from '@lsp-indexer/types';
import { IndexerError } from '../errors';
import { SubscriptionClient } from '../subscriptions/client';
import {
  fetchV3Blocks,
  fetchV3ChillwhalesNfts,
  fetchV3Controllers,
  fetchV3Creators,
  fetchV3DataValues,
  fetchV3DigitalAssets,
  fetchV3Events,
  fetchV3Followers,
  fetchV3IndexedHeads,
  fetchV3IssuedAssets,
  fetchV3MetadataRevisions,
  fetchV3Nfts,
  fetchV3OwnedAssets,
  fetchV3OwnedTokens,
  fetchV3UniversalProfiles,
  type V3BlockField,
  type V3ChillwhalesNftField,
  type V3ControllerField,
  type V3CreatorField,
  type V3DataValueField,
  type V3DigitalAssetField,
  type V3DomainFieldMap,
  type V3EventField,
  type V3FollowerField,
  type V3IndexedHeadField,
  type V3IssuedAssetField,
  type V3MetadataRevisionField,
  type V3NftField,
  type V3OwnedAssetField,
  type V3OwnedTokenField,
  type V3UniversalProfileField,
} from './api-service';
import { buildV3SubscriptionConfig } from './subscriptions';

export interface IndexerClientConfig {
  url: string;
  network: string;
  wsUrl?: string;
}

type ScopedListParams<Field extends string> = Omit<V3ListParams<Field>, 'network'>;
type ScopedDomainParams<Domain extends V3Domain> = ScopedListParams<V3DomainFieldMap[Domain]>;

export interface IndexerClient {
  readonly url: string;
  readonly wsUrl: string;
  readonly network: string;
  readonly subscriptions: SubscriptionClient;
  blocks(params?: ScopedListParams<V3BlockField>): Promise<V3ListResult<V3Block>>;
  events(params?: ScopedListParams<V3EventField>): Promise<V3ListResult<V3EventFact>>;
  profiles(
    params?: ScopedListParams<V3UniversalProfileField>,
  ): Promise<V3ListResult<V3UniversalProfile>>;
  digitalAssets(
    params?: ScopedListParams<V3DigitalAssetField>,
  ): Promise<V3ListResult<V3DigitalAsset>>;
  nfts(params?: ScopedListParams<V3NftField>): Promise<V3ListResult<V3Nft>>;
  ownedAssets(params?: ScopedListParams<V3OwnedAssetField>): Promise<V3ListResult<V3OwnedAsset>>;
  ownedTokens(params?: ScopedListParams<V3OwnedTokenField>): Promise<V3ListResult<V3OwnedToken>>;
  followers(params?: ScopedListParams<V3FollowerField>): Promise<V3ListResult<V3Follower>>;
  creators(params?: ScopedListParams<V3CreatorField>): Promise<V3ListResult<V3Creator>>;
  issuedAssets(params?: ScopedListParams<V3IssuedAssetField>): Promise<V3ListResult<V3IssuedAsset>>;
  controllers(params?: ScopedListParams<V3ControllerField>): Promise<V3ListResult<V3Controller>>;
  chillwhalesNfts(
    params?: ScopedListParams<V3ChillwhalesNftField>,
  ): Promise<V3ListResult<V3ChillwhalesNft>>;
  dataValues(params?: ScopedListParams<V3DataValueField>): Promise<V3ListResult<V3DataValue>>;
  metadataRevisions(
    params?: ScopedListParams<V3MetadataRevisionField>,
  ): Promise<V3ListResult<V3MetadataRevision>>;
  indexedHeads(params?: ScopedListParams<V3IndexedHeadField>): Promise<V3ListResult<V3IndexedHead>>;
  indexedHead(): Promise<V3IndexedHead | null>;
  subscribe<Domain extends V3Domain>(
    domain: Domain,
    params?: ScopedDomainParams<Domain>,
    options?: SubscriptionHookOptions<V3DomainResultMap[Domain]>,
  ): SubscriptionInstance<V3DomainResultMap[Domain]>;
  dispose(): void;
}

function validatedHttpUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
    return url.toString();
  } catch {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'INVALID_URL',
      message: 'Indexer URL must be an absolute HTTP or HTTPS URL',
    });
  }
}

function validatedWsUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new Error('protocol');
    return url.toString();
  } catch {
    throw new IndexerError({
      category: 'CONFIGURATION',
      code: 'INVALID_URL',
      message: 'Indexer WebSocket URL must be an absolute WS or WSS URL',
    });
  }
}

function deriveWsUrl(httpUrl: string): string {
  const url = new URL(httpUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

/** Create a network-scoped v3 client. The default fills request scope, never database identity. */
export function createIndexerClient(config: IndexerClientConfig): IndexerClient {
  const url = validatedHttpUrl(config.url);
  const networkResult = NetworkIdSchema.safeParse(config.network);
  if (!networkResult.success) {
    throw IndexerError.fromValidationError(
      networkResult.error.issues.map((issue) => ({
        ...issue,
        path: ['network', ...issue.path],
      })),
      'createIndexerClient',
    );
  }
  const network = networkResult.data;
  const wsUrl = config.wsUrl ? validatedWsUrl(config.wsUrl) : deriveWsUrl(url);
  const subscriptions = new SubscriptionClient(wsUrl);

  function scoped<Field extends string>(
    params: ScopedListParams<Field> | undefined,
  ): V3ListParams<Field> {
    return { ...params, network };
  }

  return {
    url,
    wsUrl,
    network,
    subscriptions,
    blocks(params) {
      return fetchV3Blocks(url, scoped(params));
    },
    events(params) {
      return fetchV3Events(url, scoped(params));
    },
    profiles(params) {
      return fetchV3UniversalProfiles(url, scoped(params));
    },
    digitalAssets(params) {
      return fetchV3DigitalAssets(url, scoped(params));
    },
    nfts(params) {
      return fetchV3Nfts(url, scoped(params));
    },
    ownedAssets(params) {
      return fetchV3OwnedAssets(url, scoped(params));
    },
    ownedTokens(params) {
      return fetchV3OwnedTokens(url, scoped(params));
    },
    followers(params) {
      return fetchV3Followers(url, scoped(params));
    },
    creators(params) {
      return fetchV3Creators(url, scoped(params));
    },
    issuedAssets(params) {
      return fetchV3IssuedAssets(url, scoped(params));
    },
    controllers(params) {
      return fetchV3Controllers(url, scoped(params));
    },
    chillwhalesNfts(params) {
      return fetchV3ChillwhalesNfts(url, scoped(params));
    },
    dataValues(params) {
      return fetchV3DataValues(url, scoped(params));
    },
    metadataRevisions(params) {
      return fetchV3MetadataRevisions(url, scoped(params));
    },
    indexedHeads(params) {
      return fetchV3IndexedHeads(url, scoped(params));
    },
    async indexedHead() {
      const result = await fetchV3IndexedHeads(url, { network, limit: 1 });
      return result.items[0] ?? null;
    },
    subscribe(domain, params = {}, options) {
      const subscription = buildV3SubscriptionConfig(domain, { ...params, network });
      return subscriptions.createSubscription(subscription, options);
    },
    dispose() {
      subscriptions.dispose();
    },
  };
}
