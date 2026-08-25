'use client';

import { getV3Domain } from '@lsp-indexer/next/actions';
import type { V3DomainListParams } from '@lsp-indexer/node';
import {
  createUseV3Infinite,
  createUseV3List,
  type UseV3InfiniteReturn,
  type UseV3ListReturn,
  type V3DomainQuery,
  type V3InfiniteParams,
  type V3QueryHookOptions,
} from '@lsp-indexer/react';
import type { V3Domain } from '@lsp-indexer/types';

function useServerV3Query(): V3DomainQuery {
  return getV3Domain;
}

const useV3ListImpl = createUseV3List(useServerV3Query);
const useV3InfiniteImpl = createUseV3Infinite(useServerV3Query);

/** Query any public v3 domain through a Next.js server action. */
export function useV3List<Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<Domain> {
  return useV3ListImpl(domain, params, options);
}

/** Infinitely page any public v3 domain through a Next.js server action. */
export function useV3Infinite<Domain extends V3Domain>(
  domain: Domain,
  params: V3InfiniteParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<Domain> {
  return useV3InfiniteImpl(domain, params, options);
}
