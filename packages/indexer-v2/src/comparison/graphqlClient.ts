import axios, { AxiosInstance } from 'axios';

interface GraphqlClient {
  queryCount(hasuraTable: string): Promise<number>;
  querySampleIds(hasuraTable: string, limit: number): Promise<string[]>;
  queryRowsByIds(hasuraTable: string, ids: string[]): Promise<Record<string, unknown>[]>;
  checkHealth(): Promise<boolean>;
}

interface IntrospectionField {
  name: string;
  type: {
    name?: string;
    kind: string;
    ofType?: {
      name?: string;
      kind: string;
    };
  };
}

interface IntrospectionResponse {
  data: {
    __type: {
      fields: IntrospectionField[];
    } | null;
  };
}

/**
 * Create a Hasura GraphQL client that can query aggregate counts,
 * sample row IDs, and full rows by ID.
 */
export function createGraphqlClient(url: string, adminSecret?: string): GraphqlClient {
  const client: AxiosInstance = axios.create({
    baseURL: url,
    headers: {
      'Content-Type': 'application/json',
      ...(adminSecret ? { 'x-hasura-admin-secret': adminSecret } : {}),
    },
  });

  // Cache for introspected field lists (table name → field names)
  const fieldCache = new Map<string, string[]>();

  /**
   * Query aggregate row count for a table.
   * Returns -1 if table doesn't exist (entity type missing from endpoint).
   */
  async function queryCount(hasuraTable: string): Promise<number> {
    const query = `
      query {
        ${hasuraTable}_aggregate {
          aggregate {
            count
          }
        }
      }
    `;

    try {
      const response = await client.post('', { query });
      const count = response.data?.data?.[`${hasuraTable}_aggregate`]?.aggregate?.count;
      return typeof count === 'number' ? count : -1;
    } catch (error) {
      // Table doesn't exist or query failed
      return -1;
    }
  }

  /**
   * Fetch sample row IDs from a table.
   * Returns empty array if table doesn't exist or has no 'id' column.
   */
  async function querySampleIds(hasuraTable: string, limit: number): Promise<string[]> {
    const query = `
      query {
        ${hasuraTable}(limit: ${limit}, order_by: { id: asc }) {
          id
        }
      }
    `;

    try {
      const response = await client.post('', { query });
      const rows = response.data?.data?.[hasuraTable];
      if (!Array.isArray(rows)) {
        return [];
      }
      return rows
        .map((row: { id?: string }) => row.id)
        .filter((id): id is string => typeof id === 'string');
    } catch (error) {
      return [];
    }
  }

  /**
   * Introspect table fields via GraphQL __type query.
   * Returns field names for scalar types only (excludes relations).
   */
  async function queryTableFields(hasuraTable: string): Promise<string[]> {
    // Check cache first
    if (fieldCache.has(hasuraTable)) {
      return fieldCache.get(hasuraTable)!;
    }

    const query = `
      query {
        __type(name: "${hasuraTable}") {
          fields {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    `;

    try {
      const response = await client.post<IntrospectionResponse>('', { query });
      const typeData = response.data?.data?.__type;

      if (!typeData || !typeData.fields) {
        return [];
      }

      // Filter to scalar fields only (exclude relations)
      const scalarTypeNames = new Set([
        'String',
        'Int',
        'Float',
        'Boolean',
        'ID',
        'bigint',
        'timestamptz',
        'timestamp',
        'date',
        'uuid',
        'json',
        'jsonb',
        'numeric',
      ]);

      const scalarFields = typeData.fields
        .filter((field) => {
          // Exclude __typename
          if (field.name === '__typename') {
            return false;
          }

          // Check if field type is scalar
          const typeName = field.type.name || field.type.ofType?.name;
          const typeKind = field.type.kind || field.type.ofType?.kind;

          return typeName && (scalarTypeNames.has(typeName) || typeKind === 'SCALAR');
        })
        .map((field) => field.name);

      // Cache the result
      fieldCache.set(hasuraTable, scalarFields);

      return scalarFields;
    } catch (error) {
      return [];
    }
  }

  /**
   * Query full rows by IDs, auto-discovering scalar fields.
   * Returns array of row objects with all scalar field values.
   */
  async function queryRowsByIds(
    hasuraTable: string,
    ids: string[],
  ): Promise<Record<string, unknown>[]> {
    if (ids.length === 0) {
      return [];
    }

    // Introspect fields first
    const fields = await queryTableFields(hasuraTable);
    if (fields.length === 0) {
      return [];
    }

    // Build field selection string
    const fieldSelection = fields.join('\n          ');

    // Build ID list for _in filter
    const idList = ids.map((id) => `"${id}"`).join(', ');

    const query = `
      query {
        ${hasuraTable}(where: { id: { _in: [${idList}] } }, order_by: { id: asc }) {
          ${fieldSelection}
        }
      }
    `;

    try {
      const response = await client.post('', { query });
      const rows = response.data?.data?.[hasuraTable];
      if (!Array.isArray(rows)) {
        return [];
      }
      return rows;
    } catch (error) {
      return [];
    }
  }

  /**
   * Health check - verify GraphQL endpoint is accessible.
   */
  async function checkHealth(): Promise<boolean> {
    const query = `
      query {
        __typename
      }
    `;

    try {
      const response = await client.post('', { query });
      return response.status === 200 && response.data?.data?.__typename !== undefined;
    } catch (error) {
      return false;
    }
  }

  return {
    queryCount,
    querySampleIds,
    queryRowsByIds,
    checkHealth,
  };
}
