import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { SHARED_ENUMS } from '../names.js';
import {
  indexedHeads,
  metadataJobs,
  networkConfig,
  publicTables,
  rollbackTables,
  sqdCursor,
} from '../schema.js';

describe('v3 database schema inventory', () => {
  it('registers every mutable application table for Pipes rollback', () => {
    const names = rollbackTables.map(getTableName);
    expect(names).toHaveLength(15);
    expect(new Set(names).size).toBe(names.length);
    expect(names).not.toContain(getTableName(networkConfig));
    expect(names).not.toContain(getTableName(sqdCursor));
    expect(names).toContain(getTableName(metadataJobs));

    for (const table of rollbackTables) {
      const config = getTableConfig(table);
      const primaryColumnCount = config.columns.filter((column) => column.primary).length;
      expect(primaryColumnCount + config.primaryKeys.length).toBeGreaterThan(0);
    }
  });

  it('exposes only public read models through API views', () => {
    const names = publicTables.map(getTableName);
    expect(names).toHaveLength(14);
    expect(names).not.toContain(getTableName(metadataJobs));
    expect(names).not.toContain(getTableName(sqdCursor));
    expect(names).not.toContain(getTableName(networkConfig));
  });

  it('defines the immutable shared enum catalog', () => {
    expect(Object.keys(SHARED_ENUMS).sort()).toEqual([
      'asset_standard',
      'metadata_job_status',
      'metadata_kind',
      'verification_status',
    ]);
  });

  it('anchors current and finalized indexed heads to exact block identities', () => {
    const foreignKeys = getTableConfig(indexedHeads).foreignKeys.map((key) => key.getName());
    expect(foreignKeys).toContain('indexed_heads_block_fk');
    expect(foreignKeys).toContain('indexed_heads_finalized_block_fk');
  });
});
