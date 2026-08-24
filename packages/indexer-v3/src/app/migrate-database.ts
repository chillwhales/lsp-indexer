import { loadDatabaseMigrationConfig, migrateDatabase } from '../db/index.js';

async function main(): Promise<void> {
  const result = await migrateDatabase(loadDatabaseMigrationConfig());
  console.info(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
