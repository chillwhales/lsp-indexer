import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  API_TABLE_CONTRACTS,
  HASURA_DATABASE_URL_VARIABLE,
  HASURA_PUBLIC_ROLE,
} from '../contract.js';
import { createHasuraMetadata, serializeHasuraMetadata, validateApiContract } from '../metadata.js';

const snapshotPath = fileURLToPath(new URL('../../../hasura/metadata.json', import.meta.url));

describe('v3 Hasura metadata contract', () => {
  it('tracks every public read model with aggregate and subscription permissions', () => {
    expect(validateApiContract).not.toThrow();
    const generated = createHasuraMetadata();
    const [source] = generated.metadata.sources;
    expect(source?.name).toBe('v3');
    expect(source?.configuration.connection_info.database_url).toEqual({
      from_env: HASURA_DATABASE_URL_VARIABLE,
    });
    expect(source?.tables).toHaveLength(15);
    expect(source?.tables.map(({ table }) => table.name)).toEqual(
      API_TABLE_CONTRACTS.map(({ table }) => table),
    );
    for (const table of source?.tables ?? []) {
      expect(table.table.schema).toBe('api');
      expect(table.select_permissions).toEqual([
        {
          role: HASURA_PUBLIC_ROLE,
          permission: {
            columns: '*',
            filter: {},
            allow_aggregations: true,
            query_root_fields: ['select', 'select_aggregate'],
            subscription_root_fields: ['select'],
          },
        },
      ]);
    }
  });

  it('makes every manual relationship explicitly chain-scoped', () => {
    for (const contract of API_TABLE_CONTRACTS) {
      expect(contract.paginationOrder[0]).toBe('chain_id');
      for (const relationship of [
        ...contract.objectRelationships,
        ...contract.arrayRelationships,
      ]) {
        expect(relationship.columnMapping).toMatchObject({ chain_id: 'chain_id' });
      }
    }
  });

  it('keeps the generated metadata snapshot current and excludes internal jobs', async () => {
    const snapshot = await readFile(snapshotPath, 'utf8');
    expect(JSON.parse(snapshot)).toEqual(JSON.parse(serializeHasuraMetadata()));
    expect(snapshot).not.toContain('metadata_jobs');
    expect(snapshot).not.toContain('insert_permissions');
    expect(snapshot).not.toContain('update_permissions');
    expect(snapshot).not.toContain('delete_permissions');
  });
});
