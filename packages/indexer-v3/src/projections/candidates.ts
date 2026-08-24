import type { EventFactRecord, EventIngestionBatch } from '../events/decode.js';
import { DATA_KEYS, decodeAddressKey, decodeAddressValue, isNullAddress } from './standards.js';

export type VerificationCategory = 'universalProfile' | 'digitalAsset';

export interface VerificationCandidate {
  blockNumber: number;
  blockHash: string;
  address: string;
  category: VerificationCategory;
}

function candidateKey(candidate: VerificationCandidate): string {
  return `${candidate.blockNumber}:${candidate.blockHash}:${candidate.category}:${candidate.address}`;
}

function readString(event: EventFactRecord, key: string): string | null {
  const value = event.decoded?.[key];
  return typeof value === 'string' ? value : null;
}

function addCandidate(
  candidates: Map<string, VerificationCandidate>,
  event: EventFactRecord,
  address: string | null,
  category: VerificationCategory,
): void {
  if (address == null || isNullAddress(address)) return;
  const candidate = {
    blockNumber: event.blockNumber,
    blockHash: event.blockHash,
    address,
    category,
  };
  candidates.set(candidateKey(candidate), candidate);
}

function addDataChangedReferences(
  candidates: Map<string, VerificationCandidate>,
  event: EventFactRecord,
): void {
  const dataKey = readString(event, 'dataKey');
  const dataValue = readString(event, 'dataValue');
  if (dataKey == null || dataValue == null) return;

  if (dataKey.startsWith(DATA_KEYS.lsp4CreatorsIndex)) {
    addCandidate(candidates, event, decodeAddressValue(dataValue), 'universalProfile');
  } else if (dataKey.startsWith(DATA_KEYS.lsp4CreatorsMap)) {
    addCandidate(candidates, event, decodeAddressKey(dataKey), 'universalProfile');
  }

  if (dataKey.startsWith(DATA_KEYS.lsp5ReceivedAssetsIndex)) {
    addCandidate(candidates, event, decodeAddressValue(dataValue), 'digitalAsset');
  } else if (dataKey.startsWith(DATA_KEYS.lsp5ReceivedAssetsMap)) {
    addCandidate(candidates, event, decodeAddressKey(dataKey), 'digitalAsset');
  }

  if (dataKey.startsWith(DATA_KEYS.lsp12IssuedAssetsIndex)) {
    addCandidate(candidates, event, decodeAddressValue(dataValue), 'digitalAsset');
  } else if (dataKey.startsWith(DATA_KEYS.lsp12IssuedAssetsMap)) {
    addCandidate(candidates, event, decodeAddressKey(dataKey), 'digitalAsset');
  }

  if (dataKey.startsWith(DATA_KEYS.lsp6ControllersIndex)) {
    addCandidate(candidates, event, decodeAddressValue(dataValue), 'universalProfile');
  } else if (
    dataKey.startsWith(DATA_KEYS.lsp6Permissions) ||
    dataKey.startsWith(DATA_KEYS.lsp6AllowedCalls) ||
    dataKey.startsWith(DATA_KEYS.lsp6AllowedDataKeys)
  ) {
    addCandidate(candidates, event, decodeAddressKey(dataKey), 'universalProfile');
  }
}

/** Return every address/category check required by one decoded event. */
export function collectEventVerificationCandidates(
  event: EventFactRecord,
): VerificationCandidate[] {
  if (event.decoded == null) return [];
  const candidates = new Map<string, VerificationCandidate>();

  switch (event.eventName) {
    case 'DataChanged':
      addCandidate(candidates, event, event.address, 'universalProfile');
      addCandidate(candidates, event, event.address, 'digitalAsset');
      addDataChangedReferences(candidates, event);
      break;
    case 'Executed': {
      addCandidate(candidates, event, event.address, 'universalProfile');
      const target = readString(event, 'target');
      addCandidate(candidates, event, target, 'universalProfile');
      addCandidate(candidates, event, target, 'digitalAsset');
      break;
    }
    case 'UniversalReceiver': {
      addCandidate(candidates, event, event.address, 'universalProfile');
      const from = readString(event, 'from');
      addCandidate(candidates, event, from, 'universalProfile');
      addCandidate(candidates, event, from, 'digitalAsset');
      break;
    }
    case 'Transfer':
      addCandidate(candidates, event, event.address, 'digitalAsset');
      for (const key of ['operator', 'from', 'to']) {
        addCandidate(candidates, event, readString(event, key), 'universalProfile');
      }
      break;
    case 'OwnershipTransferred':
      addCandidate(candidates, event, event.address, 'universalProfile');
      addCandidate(candidates, event, event.address, 'digitalAsset');
      addCandidate(candidates, event, readString(event, 'previousOwner'), 'universalProfile');
      addCandidate(candidates, event, readString(event, 'newOwner'), 'universalProfile');
      break;
    case 'TokenIdDataChanged':
      addCandidate(candidates, event, event.address, 'digitalAsset');
      break;
    case 'Follow':
      addCandidate(candidates, event, readString(event, 'followerAddress'), 'universalProfile');
      addCandidate(candidates, event, readString(event, 'followedAddress'), 'universalProfile');
      break;
    case 'Unfollow':
      addCandidate(candidates, event, readString(event, 'followerAddress'), 'universalProfile');
      addCandidate(candidates, event, readString(event, 'unfollowedAddress'), 'universalProfile');
      break;
    case 'DeployedContracts':
    case 'DeployedERC1167Proxies':
      addCandidate(candidates, event, readString(event, 'primaryContract'), 'universalProfile');
      break;
  }

  return [...candidates.values()];
}

/** Deduplicate a batch read plan by exact block identity, category, and address. */
export function collectProjectionCandidates(batch: EventIngestionBatch): VerificationCandidate[] {
  const candidates = new Map<string, VerificationCandidate>();
  for (const event of batch.events) {
    for (const candidate of collectEventVerificationCandidates(event)) {
      candidates.set(candidateKey(candidate), candidate);
    }
  }
  return [...candidates.values()].sort(
    (left, right) =>
      left.blockNumber - right.blockNumber ||
      left.blockHash.localeCompare(right.blockHash) ||
      left.category.localeCompare(right.category) ||
      left.address.localeCompare(right.address),
  );
}
