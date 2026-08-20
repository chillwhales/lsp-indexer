import { loadRuntimeConfig } from '../config/index.js';
import {
  createNetworkDatabase,
  createNetworkPool,
  loadNetworkDatabaseConfig,
  verifyDatabaseReadiness,
} from '../db/index.js';

async function main(): Promise<void> {
  const runtime = loadRuntimeConfig();
  const config = loadNetworkDatabaseConfig(runtime);
  const pool = createNetworkPool(config);
  try {
    const readiness = await verifyDatabaseReadiness(createNetworkDatabase(pool), runtime);
    console.info(JSON.stringify(readiness, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
