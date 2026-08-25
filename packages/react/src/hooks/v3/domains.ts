import type { V3DomainListParams } from '@lsp-indexer/node';
import type { UseSubscriptionReturn, V3DomainResultMap } from '@lsp-indexer/types';
import type {
  UseV3InfiniteReturn,
  UseV3ListReturn,
  V3InfiniteParams,
  V3QueryHookOptions,
} from '../factories/v3';
import { useV3Infinite, useV3List } from './use-v3-query';
import { useV3Subscription, type UseV3SubscriptionOptions } from './use-v3-subscription';

type NewV3Domain =
  | 'blocks'
  | 'events'
  | 'controllers'
  | 'chillwhalesNfts'
  | 'dataValues'
  | 'metadataRevisions'
  | 'indexedHeads';

function useNewDomainList<Domain extends NewV3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<Domain> {
  return useV3List(domain, params, options);
}

function useNewDomainInfinite<Domain extends NewV3Domain>(
  domain: Domain,
  params: V3InfiniteParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<Domain> {
  return useV3Infinite(domain, params, options);
}

function useNewDomainSubscription<Domain extends NewV3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
  options?: UseV3SubscriptionOptions<Domain>,
): UseSubscriptionReturn<V3DomainResultMap[Domain]> {
  return useV3Subscription(domain, params, options);
}

/** Query canonical v3 blocks. */
export function useBlocks(
  params: V3DomainListParams<'blocks'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'blocks'> {
  return useNewDomainList('blocks', params, options);
}

/** Infinitely page canonical v3 blocks. */
export function useInfiniteBlocks(
  params: V3InfiniteParams<'blocks'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'blocks'> {
  return useNewDomainInfinite('blocks', params, options);
}

/** Subscribe to canonical v3 blocks. */
export function useBlockSubscription(
  params: V3DomainListParams<'blocks'>,
  options?: UseV3SubscriptionOptions<'blocks'>,
): UseSubscriptionReturn<V3DomainResultMap['blocks']> {
  return useNewDomainSubscription('blocks', params, options);
}

/** Query normalized v3 event facts. */
export function useEvents(
  params: V3DomainListParams<'events'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'events'> {
  return useNewDomainList('events', params, options);
}

/** Infinitely page normalized v3 event facts. */
export function useInfiniteEvents(
  params: V3InfiniteParams<'events'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'events'> {
  return useNewDomainInfinite('events', params, options);
}

/** Subscribe to normalized v3 event facts. */
export function useEventSubscription(
  params: V3DomainListParams<'events'>,
  options?: UseV3SubscriptionOptions<'events'>,
): UseSubscriptionReturn<V3DomainResultMap['events']> {
  return useNewDomainSubscription('events', params, options);
}

/** Query current LSP6 controller projections. */
export function useControllers(
  params: V3DomainListParams<'controllers'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'controllers'> {
  return useNewDomainList('controllers', params, options);
}

/** Infinitely page current LSP6 controller projections. */
export function useInfiniteControllers(
  params: V3InfiniteParams<'controllers'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'controllers'> {
  return useNewDomainInfinite('controllers', params, options);
}

/** Subscribe to current LSP6 controller projections. */
export function useControllerSubscription(
  params: V3DomainListParams<'controllers'>,
  options?: UseV3SubscriptionOptions<'controllers'>,
): UseSubscriptionReturn<V3DomainResultMap['controllers']> {
  return useNewDomainSubscription('controllers', params, options);
}

/** Query the v3 Chillwhales extension projection. */
export function useChillwhalesNfts(
  params: V3DomainListParams<'chillwhalesNfts'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'chillwhalesNfts'> {
  return useNewDomainList('chillwhalesNfts', params, options);
}

/** Infinitely page the v3 Chillwhales extension projection. */
export function useInfiniteChillwhalesNfts(
  params: V3InfiniteParams<'chillwhalesNfts'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'chillwhalesNfts'> {
  return useNewDomainInfinite('chillwhalesNfts', params, options);
}

/** Subscribe to the v3 Chillwhales extension projection. */
export function useChillwhalesNftSubscription(
  params: V3DomainListParams<'chillwhalesNfts'>,
  options?: UseV3SubscriptionOptions<'chillwhalesNfts'>,
): UseSubscriptionReturn<V3DomainResultMap['chillwhalesNfts']> {
  return useNewDomainSubscription('chillwhalesNfts', params, options);
}

/** Query current ERC725Y data values. */
export function useDataValues(
  params: V3DomainListParams<'dataValues'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'dataValues'> {
  return useNewDomainList('dataValues', params, options);
}

/** Infinitely page current ERC725Y data values. */
export function useInfiniteDataValues(
  params: V3InfiniteParams<'dataValues'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'dataValues'> {
  return useNewDomainInfinite('dataValues', params, options);
}

/** Subscribe to current ERC725Y data values. */
export function useDataValueSubscription(
  params: V3DomainListParams<'dataValues'>,
  options?: UseV3SubscriptionOptions<'dataValues'>,
): UseSubscriptionReturn<V3DomainResultMap['dataValues']> {
  return useNewDomainSubscription('dataValues', params, options);
}

/** Query immutable metadata revisions. */
export function useMetadataRevisions(
  params: V3DomainListParams<'metadataRevisions'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'metadataRevisions'> {
  return useNewDomainList('metadataRevisions', params, options);
}

/** Infinitely page immutable metadata revisions. */
export function useInfiniteMetadataRevisions(
  params: V3InfiniteParams<'metadataRevisions'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'metadataRevisions'> {
  return useNewDomainInfinite('metadataRevisions', params, options);
}

/** Subscribe to immutable metadata revisions. */
export function useMetadataRevisionSubscription(
  params: V3DomainListParams<'metadataRevisions'>,
  options?: UseV3SubscriptionOptions<'metadataRevisions'>,
): UseSubscriptionReturn<V3DomainResultMap['metadataRevisions']> {
  return useNewDomainSubscription('metadataRevisions', params, options);
}

/** Query indexed-head status records. */
export function useIndexedHeads(
  params: V3DomainListParams<'indexedHeads'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'indexedHeads'> {
  return useNewDomainList('indexedHeads', params, options);
}

/** Return the indexed head for one exact network. */
export function useIndexedHead(
  params: { network: string },
  options?: V3QueryHookOptions,
): {
  indexedHead: V3DomainResultMap['indexedHeads'] | null;
} & Omit<UseV3ListReturn<'indexedHeads'>, 'items'> {
  const { items, ...queryState } = useIndexedHeads({ network: params.network, limit: 1 }, options);
  return { indexedHead: items[0] ?? null, ...queryState };
}

/** Subscribe to indexed-head status for one or more matching rows. */
export function useIndexedHeadSubscription(
  params: V3DomainListParams<'indexedHeads'>,
  options?: UseV3SubscriptionOptions<'indexedHeads'>,
): UseSubscriptionReturn<V3DomainResultMap['indexedHeads']> {
  return useNewDomainSubscription('indexedHeads', params, options);
}
