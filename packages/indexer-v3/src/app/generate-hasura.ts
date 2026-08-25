import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeHasuraMetadata } from '../api/index.js';

const outputPath = fileURLToPath(new URL('../../hasura/metadata.json', import.meta.url));

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
  const generated = serializeHasuraMetadata();
  if (process.argv.includes('--check')) {
    const existing = await readExisting();
    if (
      existing == null ||
      JSON.stringify(JSON.parse(existing)) !== JSON.stringify(JSON.parse(generated))
    ) {
      throw new Error('hasura/metadata.json is stale; run pnpm hasura:generate');
    }
    console.info('Hasura metadata is up to date');
    return;
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, generated);
  console.info(`Generated ${outputPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
