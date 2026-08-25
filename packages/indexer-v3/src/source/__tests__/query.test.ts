import { describe, expect, it } from 'vitest';
import { createRuntimeProbeQuery, RUNTIME_PROBE_FIELDS } from '../query.js';

describe('runtime probe query', () => {
  it('selects the provenance needed by future domain decoders', () => {
    const query = createRuntimeProbeQuery({ from: 100, to: 200 });

    expect(query.getFields()).toEqual(RUNTIME_PROBE_FIELDS);
    expect(query.getRequests()).toEqual([
      {
        range: { from: 100, to: 200 },
        request: { includeAllBlocks: true },
      },
      {
        range: { from: 100, to: 200 },
        request: { logs: [{}] },
      },
    ]);
  });

  it('preserves a latest-relative Pipes range', () => {
    const query = createRuntimeProbeQuery({ from: 'latest', to: '+10' });

    expect(query.getRequests()[0]?.range).toEqual({ from: 'latest', to: 10 });
    expect(query.getRequests()[0]?.request).toEqual({ includeAllBlocks: true });
  });

  it('keeps block zero as an explicit inclusive end', () => {
    const query = createRuntimeProbeQuery({ from: 0, to: 0 });

    expect(query.getRequests()[0]?.range).toEqual({ from: 0, to: 0 });
    expect(query.getRequests()[1]?.range).toEqual({ from: 0, to: 0 });
  });
});
