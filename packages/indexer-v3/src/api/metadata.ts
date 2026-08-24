import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { API_SCHEMA } from '../db/names.js';
import { publicTables } from '../db/schema.js';
import {
  API_TABLE_CONTRACTS,
  HASURA_DATABASE_URL_VARIABLE,
  HASURA_PUBLIC_ROLE,
  HASURA_SOURCE_NAME,
  type ApiRelationshipContract,
  type ApiTableContract,
  type ApiTableName,
} from './contract.js';

interface HasuraTableName {
  name: string;
  schema: string;
}

interface HasuraManualRelationship {
  manual_configuration: {
    column_mapping: Readonly<Record<string, string>>;
    insertion_order: null;
    remote_table: HasuraTableName;
  };
}

interface HasuraRelationship {
  name: string;
  using: HasuraManualRelationship;
}

interface HasuraTableMetadata {
  table: HasuraTableName;
  configuration: {
    custom_name: string;
    custom_root_fields: {
      select: string;
      select_aggregate: string;
    };
  };
  object_relationships?: HasuraRelationship[];
  array_relationships?: HasuraRelationship[];
  select_permissions: {
    role: string;
    permission: {
      columns: '*';
      filter: Record<string, never>;
      allow_aggregations: true;
      query_root_fields: ['select', 'select_aggregate'];
      subscription_root_fields: ['select'];
    };
  }[];
}

export interface HasuraMetadataExport {
  resource_version: number;
  metadata: {
    version: number;
    sources: {
      name: string;
      kind: 'postgres';
      tables: HasuraTableMetadata[];
      configuration: {
        connection_info: {
          database_url: { from_env: string };
          isolation_level: 'read-committed';
          pool_settings: {
            connection_lifetime: number;
            idle_timeout: number;
            max_connections: number;
            retries: number;
          };
          use_prepared_statements: true;
        };
      };
    }[];
  };
}

function tableName(name: ApiTableName): HasuraTableName {
  return { name, schema: API_SCHEMA };
}

function relationshipMetadata(relationship: ApiRelationshipContract): HasuraRelationship {
  return {
    name: relationship.name,
    using: {
      manual_configuration: {
        column_mapping: relationship.columnMapping,
        insertion_order: null,
        remote_table: tableName(relationship.remoteTable),
      },
    },
  };
}

function tableMetadata(contract: ApiTableContract): HasuraTableMetadata {
  return {
    table: tableName(contract.table),
    configuration: {
      custom_name: contract.graphqlName,
      custom_root_fields: {
        select: contract.graphqlName,
        select_aggregate: `${contract.graphqlName}_aggregate`,
      },
    },
    ...(contract.objectRelationships.length === 0
      ? {}
      : { object_relationships: contract.objectRelationships.map(relationshipMetadata) }),
    ...(contract.arrayRelationships.length === 0
      ? {}
      : { array_relationships: contract.arrayRelationships.map(relationshipMetadata) }),
    select_permissions: [
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
    ],
  };
}

function schemaColumns(): Map<string, Set<string>> {
  return new Map(
    publicTables.map((table) => [
      getTableName(table),
      new Set(getTableConfig(table).columns.map(({ name }) => name)),
    ]),
  );
}

function validateRelationship(
  contract: ApiTableContract,
  relationship: ApiRelationshipContract,
  columns: Map<string, Set<string>>,
): void {
  const localColumns = columns.get(contract.table);
  const remoteColumns = columns.get(relationship.remoteTable);
  if (localColumns == null || remoteColumns == null) {
    throw new Error(`Relationship ${contract.table}.${relationship.name} targets an unknown table`);
  }
  const mappings = Object.entries(relationship.columnMapping);
  if (mappings.length === 0) {
    throw new Error(`Relationship ${contract.table}.${relationship.name} has no column mapping`);
  }
  if (relationship.columnMapping.chain_id !== 'chain_id') {
    throw new Error(`Relationship ${contract.table}.${relationship.name} must be chain-scoped`);
  }
  for (const [local, remote] of mappings) {
    if (!localColumns.has(local)) {
      throw new Error(`Relationship ${contract.table}.${relationship.name} uses unknown ${local}`);
    }
    if (!remoteColumns.has(remote)) {
      throw new Error(
        `Relationship ${contract.table}.${relationship.name} targets unknown ${remote}`,
      );
    }
  }
}

/** Fail fast when Drizzle tables and the checked-in GraphQL contract diverge. */
export function validateApiContract(): void {
  const graphQlName = /^[_A-Za-z][_0-9A-Za-z]*$/;
  const columns = schemaColumns();
  const tableNames = publicTables.map(getTableName);
  const contractNames = API_TABLE_CONTRACTS.map(({ table }) => table);
  if (new Set(contractNames).size !== contractNames.length) {
    throw new Error('The v3 API contract contains duplicate tables');
  }
  if (
    tableNames.length !== contractNames.length ||
    tableNames.some((name, index) => name !== contractNames[index])
  ) {
    throw new Error('The v3 API contract must track every public table in schema order');
  }

  const rootNames = new Set<string>();
  for (const contract of API_TABLE_CONTRACTS) {
    if (!graphQlName.test(contract.graphqlName)) {
      throw new Error(`Invalid GraphQL name ${contract.graphqlName}`);
    }
    if (rootNames.has(contract.graphqlName)) {
      throw new Error(`Duplicate GraphQL root ${contract.graphqlName}`);
    }
    rootNames.add(contract.graphqlName);
    const tableColumns = columns.get(contract.table);
    if (contract.paginationOrder.length === 0 || contract.paginationOrder[0] !== 'chain_id') {
      throw new Error(`${contract.table} pagination must start with chain_id`);
    }
    if (contract.paginationOrder.some((column) => !tableColumns?.has(column))) {
      throw new Error(`${contract.table} pagination uses an unknown column`);
    }
    const relationships = [...contract.objectRelationships, ...contract.arrayRelationships];
    const relationshipNames = relationships.map(({ name }) => name);
    if (new Set(relationshipNames).size !== relationshipNames.length) {
      throw new Error(`Duplicate relationship on ${contract.table}`);
    }
    for (const relationship of relationships) {
      if (!graphQlName.test(relationship.name)) {
        throw new Error(`Invalid relationship name ${contract.table}.${relationship.name}`);
      }
      validateRelationship(contract, relationship, columns);
    }
  }
}

/** Generate the complete read-only Hasura v3 metadata export. */
export function createHasuraMetadata(): HasuraMetadataExport {
  validateApiContract();
  return {
    resource_version: 1,
    metadata: {
      version: 3,
      sources: [
        {
          name: HASURA_SOURCE_NAME,
          kind: 'postgres',
          tables: API_TABLE_CONTRACTS.map(tableMetadata),
          configuration: {
            connection_info: {
              database_url: { from_env: HASURA_DATABASE_URL_VARIABLE },
              isolation_level: 'read-committed',
              pool_settings: {
                connection_lifetime: 600,
                idle_timeout: 180,
                max_connections: 50,
                retries: 1,
              },
              use_prepared_statements: true,
            },
          },
        },
      ],
    },
  };
}

/** Stable representation used by generation and drift checks. */
export function serializeHasuraMetadata(): string {
  return `${JSON.stringify(createHasuraMetadata(), null, 2)}\n`;
}
