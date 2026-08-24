import { buildSchema } from 'graphql';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertApiSchema, serializeApiSchema } from '../schema.js';

const snapshotPath = fileURLToPath(new URL('../../../hasura/schema.graphql', import.meta.url));

describe('v3 public GraphQL schema contract', () => {
  it('keeps the checked-in Hasura schema valid and canonical', async () => {
    const snapshot = await readFile(snapshotPath, 'utf8');
    const schema = buildSchema(snapshot);

    expect(() => assertApiSchema(schema)).not.toThrow();
    expect(serializeApiSchema(schema)).toBe(snapshot);
  });
});
