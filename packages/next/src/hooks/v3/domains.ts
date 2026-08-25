'use client';

import type { V3DomainListParams } from '@lsp-indexer/node';
import type {
  UseV3InfiniteReturn,
  UseV3ListReturn,
  V3InfiniteParams,
  V3QueryHookOptions,
} from '@lsp-indexer/react';
import { useV3Infinite, useV3List } from './use-v3-query';

type NextV3Domain =
  | 'blocks'
  | 'events'
  | 'controllers'
  | 'chillwhalesNfts'
  | 'dataValues'
  | 'metadataRevisions'
  | 'indexedHeads';

function useNextDomainList<Domain extends NextV3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<Domain> {
  return useV3List(domain, params, options);
}

function useNextDomainInfinite<Domain extends NextV3Domain>(
  domain: Domain,
  params: V3InfiniteParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<Domain> {
  return useV3Infinite(domain, params, options);
}

export function useBlocks(
  params: V3DomainListParams<'blocks'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'blocks'> {
  return useNextDomainList('blocks', params, options);
}

export function useInfiniteBlocks(
  params: V3InfiniteParams<'blocks'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'blocks'> {
  return useNextDomainInfinite('blocks', params, options);
}

export function useEvents(
  params: V3DomainListParams<'events'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'events'> {
  return useNextDomainList('events', params, options);
}

export function useInfiniteEvents(
  params: V3InfiniteParams<'events'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'events'> {
  return useNextDomainInfinite('events', params, options);
}

export function useControllers(
  params: V3DomainListParams<'controllers'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'controllers'> {
  return useNextDomainList('controllers', params, options);
}

export function useInfiniteControllers(
  params: V3InfiniteParams<'controllers'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'controllers'> {
  return useNextDomainInfinite('controllers', params, options);
}

export function useChillwhalesNfts(
  params: V3DomainListParams<'chillwhalesNfts'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'chillwhalesNfts'> {
  return useNextDomainList('chillwhalesNfts', params, options);
}

export function useInfiniteChillwhalesNfts(
  params: V3InfiniteParams<'chillwhalesNfts'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'chillwhalesNfts'> {
  return useNextDomainInfinite('chillwhalesNfts', params, options);
}

export function useDataValues(
  params: V3DomainListParams<'dataValues'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'dataValues'> {
  return useNextDomainList('dataValues', params, options);
}

export function useInfiniteDataValues(
  params: V3InfiniteParams<'dataValues'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'dataValues'> {
  return useNextDomainInfinite('dataValues', params, options);
}

export function useMetadataRevisions(
  params: V3DomainListParams<'metadataRevisions'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'metadataRevisions'> {
  return useNextDomainList('metadataRevisions', params, options);
}

export function useInfiniteMetadataRevisions(
  params: V3InfiniteParams<'metadataRevisions'>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<'metadataRevisions'> {
  return useNextDomainInfinite('metadataRevisions', params, options);
}

export function useIndexedHeads(
  params: V3DomainListParams<'indexedHeads'>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<'indexedHeads'> {
  return useNextDomainList('indexedHeads', params, options);
}

export function useIndexedHead(
  params: { network: string },
  options?: V3QueryHookOptions,
): {
  indexedHead: UseV3ListReturn<'indexedHeads'>['items'][number] | null;
} & Omit<UseV3ListReturn<'indexedHeads'>, 'items'> {
  const { items, ...queryState } = useIndexedHeads({ network: params.network, limit: 1 }, options);
  return { indexedHead: items[0] ?? null, ...queryState };
}
