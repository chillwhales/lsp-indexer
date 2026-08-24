import type { LookupFunction } from 'node:net';

interface PinnedDnsAddress {
  address: string;
  family: 4 | 6;
}

/** Create the Node lookup callback that pins one previously validated DNS address. */
export function createPinnedLookup(address: PinnedDnsAddress): LookupFunction {
  return (_hostname, options, callback): void => {
    if (options.all) {
      callback(null, [address]);
      return;
    }
    callback(null, address.address, address.family);
  };
}
