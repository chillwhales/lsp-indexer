import type { LookupAddress } from 'node:dns';
import { describe, expect, it } from 'vitest';
import { createPinnedLookup } from '../pinnedLookup.js';

describe('pinned metadata DNS lookup', () => {
  it('returns the callback shape requested by Node', () => {
    const address = { address: '93.184.216.34', family: 4 } satisfies {
      address: string;
      family: 4 | 6;
    };
    const lookup = createPinnedLookup(address);
    let allResult: string | LookupAddress[] | undefined;
    let scalarResult: string | LookupAddress[] | undefined;
    let scalarFamily: number | undefined;

    lookup('example.com', { all: true }, (error, result) => {
      expect(error).toBeNull();
      allResult = result;
    });
    lookup('example.com', { all: false }, (error, result, family) => {
      expect(error).toBeNull();
      scalarResult = result;
      scalarFamily = family;
    });

    expect(allResult).toEqual([address]);
    expect(scalarResult).toBe(address.address);
    expect(scalarFamily).toBe(address.family);
  });
});
