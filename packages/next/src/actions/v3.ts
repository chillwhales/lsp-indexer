'use server';

import { fetchV3Domain, getServerUrl, type V3DomainListParams } from '@lsp-indexer/node';
import {
  V3DomainSchema,
  V3ListParamsSchema,
  type V3Domain,
  type V3DomainResultMap,
  type V3ListResult,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action for any public v3 domain. */
export async function getV3Domain<Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
): Promise<V3ListResult<V3DomainResultMap[Domain]>> {
  validateInput(V3DomainSchema, domain, 'getV3Domain.domain');
  validateInput(V3ListParamsSchema, params, 'getV3Domain.params');
  return await fetchV3Domain(getServerUrl(), domain, params);
}

export async function getV3Blocks(
  params: V3DomainListParams<'blocks'>,
): Promise<V3ListResult<V3DomainResultMap['blocks']>> {
  return await getV3Domain('blocks', params);
}

export async function getV3Events(
  params: V3DomainListParams<'events'>,
): Promise<V3ListResult<V3DomainResultMap['events']>> {
  return await getV3Domain('events', params);
}

export async function getV3UniversalProfiles(
  params: V3DomainListParams<'profiles'>,
): Promise<V3ListResult<V3DomainResultMap['profiles']>> {
  return await getV3Domain('profiles', params);
}

export async function getV3DigitalAssets(
  params: V3DomainListParams<'digitalAssets'>,
): Promise<V3ListResult<V3DomainResultMap['digitalAssets']>> {
  return await getV3Domain('digitalAssets', params);
}

export async function getV3Nfts(
  params: V3DomainListParams<'nfts'>,
): Promise<V3ListResult<V3DomainResultMap['nfts']>> {
  return await getV3Domain('nfts', params);
}

export async function getV3OwnedAssets(
  params: V3DomainListParams<'ownedAssets'>,
): Promise<V3ListResult<V3DomainResultMap['ownedAssets']>> {
  return await getV3Domain('ownedAssets', params);
}

export async function getV3OwnedTokens(
  params: V3DomainListParams<'ownedTokens'>,
): Promise<V3ListResult<V3DomainResultMap['ownedTokens']>> {
  return await getV3Domain('ownedTokens', params);
}

export async function getV3Followers(
  params: V3DomainListParams<'followers'>,
): Promise<V3ListResult<V3DomainResultMap['followers']>> {
  return await getV3Domain('followers', params);
}

export async function getV3Creators(
  params: V3DomainListParams<'creators'>,
): Promise<V3ListResult<V3DomainResultMap['creators']>> {
  return await getV3Domain('creators', params);
}

export async function getV3IssuedAssets(
  params: V3DomainListParams<'issuedAssets'>,
): Promise<V3ListResult<V3DomainResultMap['issuedAssets']>> {
  return await getV3Domain('issuedAssets', params);
}

export async function getV3Controllers(
  params: V3DomainListParams<'controllers'>,
): Promise<V3ListResult<V3DomainResultMap['controllers']>> {
  return await getV3Domain('controllers', params);
}

export async function getV3ChillwhalesNfts(
  params: V3DomainListParams<'chillwhalesNfts'>,
): Promise<V3ListResult<V3DomainResultMap['chillwhalesNfts']>> {
  return await getV3Domain('chillwhalesNfts', params);
}

export async function getV3DataValues(
  params: V3DomainListParams<'dataValues'>,
): Promise<V3ListResult<V3DomainResultMap['dataValues']>> {
  return await getV3Domain('dataValues', params);
}

export async function getV3MetadataRevisions(
  params: V3DomainListParams<'metadataRevisions'>,
): Promise<V3ListResult<V3DomainResultMap['metadataRevisions']>> {
  return await getV3Domain('metadataRevisions', params);
}

export async function getV3IndexedHeads(
  params: V3DomainListParams<'indexedHeads'>,
): Promise<V3ListResult<V3DomainResultMap['indexedHeads']>> {
  return await getV3Domain('indexedHeads', params);
}

/** Return the indexed head for one exact network. */
export async function getIndexedHead(params: {
  network: string;
}): Promise<V3DomainResultMap['indexedHeads'] | null> {
  const result = await getV3IndexedHeads({ network: params.network, limit: 1 });
  return result.items[0] ?? null;
}

/** Short action names for v3-only public domain families. */
export async function getBlocks(
  params: V3DomainListParams<'blocks'>,
): Promise<V3ListResult<V3DomainResultMap['blocks']>> {
  return await getV3Blocks(params);
}

export async function getEvents(
  params: V3DomainListParams<'events'>,
): Promise<V3ListResult<V3DomainResultMap['events']>> {
  return await getV3Events(params);
}

export async function getControllers(
  params: V3DomainListParams<'controllers'>,
): Promise<V3ListResult<V3DomainResultMap['controllers']>> {
  return await getV3Controllers(params);
}

export async function getChillwhalesNfts(
  params: V3DomainListParams<'chillwhalesNfts'>,
): Promise<V3ListResult<V3DomainResultMap['chillwhalesNfts']>> {
  return await getV3ChillwhalesNfts(params);
}

export async function getDataValues(
  params: V3DomainListParams<'dataValues'>,
): Promise<V3ListResult<V3DomainResultMap['dataValues']>> {
  return await getV3DataValues(params);
}

export async function getMetadataRevisions(
  params: V3DomainListParams<'metadataRevisions'>,
): Promise<V3ListResult<V3DomainResultMap['metadataRevisions']>> {
  return await getV3MetadataRevisions(params);
}

export async function getIndexedHeads(
  params: V3DomainListParams<'indexedHeads'>,
): Promise<V3ListResult<V3DomainResultMap['indexedHeads']>> {
  return await getV3IndexedHeads(params);
}
