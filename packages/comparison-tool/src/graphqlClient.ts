import axios, { AxiosInstance } from 'axios';

export interface GraphqlClient {
  queryCount(hasuraTable: string): Promise<number>;
  querySampleIds(hasuraTable: string, limit: number): Promise<string[]>;
  queryRowsByIds(hasuraTable: string, ids: string[]): Promise<Record<string, unknown>[]>;
  querySampleRows(hasuraTable: string, limit: number): Promise<Record<string, unknown>[]>;
  checkHealth(): Promise<boolean>;
}

/** Standard GraphQL response envelope with typed data payload. */
interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface AggregateData {
  [key: string]: { aggregate: { count: number } } | undefined;
}

interface SampleIdsData {
  [key: string]: Array<{ id?: string }> | undefined;
}

interface RowsData {
  [key: string]: Record<string, unknown>[] | undefined;
}

interface HealthData {
  __typename?: string;
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

interface IntrospectionData {
  __type: {
    fields: IntrospectionField[];
  } | null;
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

  const fieldCache = new Map<string, string[]>();

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
      const response = await client.post<GraphqlResponse<AggregateData>>('', { query });
      if (response.data.errors || !response.data.data) return -1;
      const count = response.data.data[`${hasuraTable}_aggregate`]?.aggregate?.count;
      return typeof count === 'number' ? count : -1;
    } catch {
      return -1;
    }
  }

  async function querySampleIds(hasuraTable: string, limit: number): Promise<string[]> {
    const query = `
      query {
        ${hasuraTable}(limit: ${limit}, order_by: { id: asc }) {
          id
        }
      }
    `;

    try {
      const response = await client.post<GraphqlResponse<SampleIdsData>>('', { query });
      const rows = response.data.data?.[hasuraTable];
      if (!Array.isArray(rows)) return [];
      return rows.map((row) => row.id).filter((id): id is string => typeof id === 'string');
    } catch {
      return [];
    }
  }

  async function queryTableFields(hasuraTable: string): Promise<string[]> {
    const cached = fieldCache.get(hasuraTable);
    if (cached) {
      return cached;
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
      const response = await client.post<GraphqlResponse<IntrospectionData>>('', { query });
      const typeData = response.data.data?.__type;

      if (!typeData || !typeData.fields) return [];

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
          if (field.name === '__typename') return false;
          const typeName = field.type.name || field.type.ofType?.name;
          const typeKind = field.type.kind || field.type.ofType?.kind;
          return typeName && (scalarTypeNames.has(typeName) || typeKind === 'SCALAR');
        })
        .map((field) => field.name);

      fieldCache.set(hasuraTable, scalarFields);
      return scalarFields;
    } catch {
      return [];
    }
  }

  async function queryRowsByIds(
    hasuraTable: string,
    ids: string[],
  ): Promise<Record<string, unknown>[]> {
    if (ids.length === 0) return [];

    const fields = await queryTableFields(hasuraTable);
    if (fields.length === 0) return [];

    const fieldSelection = fields.join('\n          ');
    const idList = ids.map((id) => `"${id}"`).join(', ');

    const query = `
      query {
        ${hasuraTable}(where: { id: { _in: [${idList}] } }, order_by: { id: asc }) {
          ${fieldSelection}
        }
      }
    `;

    try {
      const response = await client.post<GraphqlResponse<RowsData>>('', { query });
      const rows = response.data.data?.[hasuraTable];
      if (!Array.isArray(rows)) return [];
      return rows;
    } catch {
      return [];
    }
  }

  async function querySampleRows(
    hasuraTable: string,
    limit: number,
  ): Promise<Record<string, unknown>[]> {
    const fields = await queryTableFields(hasuraTable);
    if (fields.length === 0) return [];

    const fieldSelection = fields.join('\n          ');

    const query = `
      query {
        ${hasuraTable}(limit: ${limit}, order_by: { id: asc }) {
          ${fieldSelection}
        }
      }
    `;

    try {
      const response = await client.post<GraphqlResponse<RowsData>>('', { query });
      const rows = response.data.data?.[hasuraTable];
      if (!Array.isArray(rows)) return [];
      return rows;
    } catch {
      return [];
    }
  }

  async function checkHealth(): Promise<boolean> {
    try {
      const response = await client.post<GraphqlResponse<HealthData>>('', {
        query: '{ __typename }',
      });
      return response.status === 200 && response.data.data?.__typename !== undefined;
    } catch {
      return false;
    }
  }

  return { queryCount, querySampleIds, queryRowsByIds, querySampleRows, checkHealth };
}
