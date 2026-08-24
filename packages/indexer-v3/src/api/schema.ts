import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  isInputObjectType,
  isObjectType,
  lexicographicSortSchema,
  printSchema,
  type GraphQLSchema,
} from 'graphql';
import { publicTables } from '../db/schema.js';
import { API_TABLE_CONTRACTS, type ApiTableContract } from './contract.js';

function tableColumns(): Map<string, string[]> {
  return new Map(
    publicTables.map((table) => [
      getTableName(table),
      getTableConfig(table).columns.map(({ name }) => name),
    ]),
  );
}

function requireFields(
  fields: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  owner: string,
  errors: string[],
): void {
  for (const name of expected) {
    if (fields[name] == null) errors.push(`${owner} is missing ${name}`);
  }
}

function validateTableType(
  schema: GraphQLSchema,
  contract: ApiTableContract,
  columns: Map<string, string[]>,
  errors: string[],
): void {
  const type = schema.getType(contract.graphqlName);
  if (!isObjectType(type)) {
    errors.push(`Schema is missing object type ${contract.graphqlName}`);
    return;
  }
  requireFields(type.getFields(), columns.get(contract.table) ?? [], contract.graphqlName, errors);
  requireFields(
    type.getFields(),
    [
      ...contract.objectRelationships.map(({ name }) => name),
      ...contract.arrayRelationships.flatMap(({ name }) => [name, `${name}_aggregate`]),
    ],
    contract.graphqlName,
    errors,
  );

  for (const suffix of ['bool_exp', 'order_by']) {
    const input = schema.getType(`${contract.graphqlName}_${suffix}`);
    if (!isInputObjectType(input)) {
      errors.push(`Schema is missing input ${contract.graphqlName}_${suffix}`);
    } else if (suffix === 'order_by') {
      requireFields(
        input.getFields(),
        contract.paginationOrder,
        `${contract.graphqlName}_order_by`,
        errors,
      );
    }
  }
  if (schema.getType(`${contract.graphqlName}_aggregate`) == null) {
    errors.push(`Schema is missing aggregate ${contract.graphqlName}_aggregate`);
  }
}

/** Validate the live public schema against every v3 domain and package primitive. */
export function assertApiSchema(schema: GraphQLSchema): void {
  const errors: string[] = [];
  const query = schema.getQueryType();
  const subscription = schema.getSubscriptionType();
  if (query == null) errors.push('Schema has no query root');
  if (subscription == null) errors.push('Schema has no subscription root');
  const queryFields = query?.getFields() ?? {};
  const subscriptionFields = subscription?.getFields() ?? {};
  const columns = tableColumns();

  for (const contract of API_TABLE_CONTRACTS) {
    const select = queryFields[contract.graphqlName];
    const aggregateName = `${contract.graphqlName}_aggregate`;
    const requiredArguments = ['distinct_on', 'limit', 'offset', 'order_by', 'where'];
    if (select == null) {
      errors.push(`Query root is missing ${contract.graphqlName}`);
    } else {
      const argumentsByName = Object.fromEntries(
        select.args.map((argument) => [argument.name, argument]),
      );
      requireFields(argumentsByName, requiredArguments, `Query ${contract.graphqlName}`, errors);
    }
    const aggregate = queryFields[aggregateName];
    if (aggregate == null) {
      errors.push(`Query root is missing ${aggregateName}`);
    } else {
      const argumentsByName = Object.fromEntries(
        aggregate.args.map((argument) => [argument.name, argument]),
      );
      requireFields(argumentsByName, requiredArguments, `Query ${aggregateName}`, errors);
    }
    const subscriptionSelect = subscriptionFields[contract.graphqlName];
    if (subscriptionSelect == null) {
      errors.push(`Subscription root is missing ${contract.graphqlName}`);
    } else {
      const argumentsByName = Object.fromEntries(
        subscriptionSelect.args.map((argument) => [argument.name, argument]),
      );
      requireFields(
        argumentsByName,
        requiredArguments,
        `Subscription ${contract.graphqlName}`,
        errors,
      );
    }
    if (subscriptionFields[`${contract.graphqlName}_stream`] != null) {
      errors.push(`Public v3 schema must not expose ${contract.graphqlName}_stream`);
    }
    validateTableType(schema, contract, columns, errors);
  }

  if (schema.getMutationType() != null) errors.push('Public v3 schema must not expose mutations');
  if (queryFields.metadata_jobs != null || schema.getType('metadata_jobs') != null) {
    errors.push('Internal metadata jobs leaked into the public schema');
  }
  if (errors.length > 0) throw new Error(`Invalid v3 Hasura schema:\n- ${errors.join('\n- ')}`);
}

/** Canonical schema snapshot consumed by code generation in the v3 package goals. */
export function serializeApiSchema(schema: GraphQLSchema): string {
  assertApiSchema(schema);
  return `${printSchema(lexicographicSortSchema(schema))}\n`;
}
