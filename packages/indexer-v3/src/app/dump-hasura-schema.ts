import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchPublicHasuraSchema, loadHasuraApiConfig, serializeApiSchema } from '../api/index.js';

const outputPath = fileURLToPath(new URL('../../hasura/schema.graphql', import.meta.url));

async function readExisting(): Promise<string | null> {
  try {
    return await readFile(outputPath, 'utf8');
  } catch (error) {
    if (typeof error === 'object' && error != null && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const schema = serializeApiSchema(await fetchPublicHasuraSchema(loadHasuraApiConfig()));
  if (process.argv.includes('--check')) {
    if ((await readExisting()) !== schema) {
      throw new Error('hasura/schema.graphql differs from the live public schema');
    }
    console.info('Live public Hasura schema matches the checked-in snapshot');
    return;
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, schema);
  console.info(`Generated ${outputPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
