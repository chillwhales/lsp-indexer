import { loadShadowParityConfig, runShadowParity } from '../acceptance/index.js';

async function main(): Promise<void> {
  const report = await runShadowParity(loadShadowParityConfig());
  console.info(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
