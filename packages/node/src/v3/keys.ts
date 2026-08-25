import type { V3Domain, V3ListParams } from '@lsp-indexer/types';

function normalizeKeyValue(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(normalizeKeyValue);
  if (typeof value !== 'object' || value === null) return value;
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    normalized[key] = normalizeKeyValue(Reflect.get(value, key));
  }
  return normalized;
}

export const v3Keys = {
  all: ['lsp-indexer', 'v3'] as const,
  networks: () => [...v3Keys.all, 'networks'] as const,
  network: (network: string) => [...v3Keys.networks(), network] as const,
  domains: (network: string) => [...v3Keys.network(network), 'domains'] as const,
  domain: (network: string, domain: V3Domain) => [...v3Keys.domains(network), domain] as const,
  lists: (network: string, domain: V3Domain) =>
    [...v3Keys.domain(network, domain), 'list'] as const,
  list: <Field extends string>(domain: V3Domain, params: V3ListParams<Field>) =>
    [
      ...v3Keys.lists(params.network, domain),
      {
        filter: normalizeKeyValue(params.filter),
        sort: normalizeKeyValue(params.sort),
        limit: params.limit,
        offset: params.offset,
      },
    ] as const,
  details: (network: string, domain: V3Domain) =>
    [...v3Keys.domain(network, domain), 'detail'] as const,
  detail: (domain: V3Domain, network: string, identity: Readonly<Record<string, unknown>>) =>
    [...v3Keys.details(network, domain), normalizeKeyValue(identity)] as const,
} as const;
