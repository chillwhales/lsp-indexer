import type { V3Domain, V3DomainResultMap } from '@lsp-indexer/types';
import { TypedDocumentString } from '../graphql/graphql';
import type { SubscriptionConfig } from '../subscriptions/types';
import { buildV3DomainVariables, type V3DomainListParams } from './api-service';
import {
  V3BlocksSubscriptionDocument,
  V3ChillwhalesNftsSubscriptionDocument,
  V3ControllersSubscriptionDocument,
  V3CreatorsSubscriptionDocument,
  V3DataValuesSubscriptionDocument,
  V3DigitalAssetsSubscriptionDocument,
  V3EventsSubscriptionDocument,
  V3FollowersSubscriptionDocument,
  V3IndexedHeadsSubscriptionDocument,
  V3IssuedAssetsSubscriptionDocument,
  V3MetadataRevisionsSubscriptionDocument,
  V3NftsSubscriptionDocument,
  V3OwnedAssetsSubscriptionDocument,
  V3OwnedTokensSubscriptionDocument,
  V3UniversalProfilesSubscriptionDocument,
} from './operations';
import { v3Parsers } from './parsers';

interface V3SubscriptionEnvelope {
  items: unknown[];
}

function sourceDocument(domain: V3Domain): string {
  switch (domain) {
    case 'blocks':
      return V3BlocksSubscriptionDocument.toString();
    case 'events':
      return V3EventsSubscriptionDocument.toString();
    case 'profiles':
      return V3UniversalProfilesSubscriptionDocument.toString();
    case 'digitalAssets':
      return V3DigitalAssetsSubscriptionDocument.toString();
    case 'nfts':
      return V3NftsSubscriptionDocument.toString();
    case 'ownedAssets':
      return V3OwnedAssetsSubscriptionDocument.toString();
    case 'ownedTokens':
      return V3OwnedTokensSubscriptionDocument.toString();
    case 'followers':
      return V3FollowersSubscriptionDocument.toString();
    case 'creators':
      return V3CreatorsSubscriptionDocument.toString();
    case 'issuedAssets':
      return V3IssuedAssetsSubscriptionDocument.toString();
    case 'controllers':
      return V3ControllersSubscriptionDocument.toString();
    case 'chillwhalesNfts':
      return V3ChillwhalesNftsSubscriptionDocument.toString();
    case 'dataValues':
      return V3DataValuesSubscriptionDocument.toString();
    case 'metadataRevisions':
      return V3MetadataRevisionsSubscriptionDocument.toString();
    case 'indexedHeads':
      return V3IndexedHeadsSubscriptionDocument.toString();
  }
}

function parseDomainRow<Domain extends V3Domain>(
  domain: Domain,
  value: unknown,
): V3DomainResultMap[Domain] {
  // Domain and parser are paired by the exhaustive map; TypeScript cannot preserve that
  // correlation after generic indexed access, so this is the package service boundary cast.
  return v3Parsers[domain](value) as V3DomainResultMap[Domain];
}

export function buildV3SubscriptionConfig<Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
): SubscriptionConfig<
  V3SubscriptionEnvelope,
  Record<string, unknown>,
  unknown,
  V3DomainResultMap[Domain]
> {
  return {
    document: new TypedDocumentString<V3SubscriptionEnvelope, Record<string, unknown>>(
      sourceDocument(domain),
    ),
    variables: buildV3DomainVariables(domain, params),
    extract(result) {
      return result.items;
    },
    parser(rows) {
      return rows.map((row) => parseDomainRow(domain, row));
    },
  };
}
