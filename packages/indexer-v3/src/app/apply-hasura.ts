import {
  applyHasuraMetadata,
  assertHasuraMetadataConsistent,
  loadHasuraApiConfig,
} from '../api/index.js';

async function main(): Promise<void> {
  const config = loadHasuraApiConfig();
  await applyHasuraMetadata(config);
  await assertHasuraMetadataConsistent(config);
  console.info('Applied consistent v3 Hasura metadata');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
