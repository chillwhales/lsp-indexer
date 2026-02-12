#!/usr/bin/env ts-node

import { runComparison } from './comparisonEngine';
import { printReport } from './reporter';
import { ComparisonConfig } from './types';

/**
 * Parse command-line arguments from process.argv.
 * Returns parsed config or null if invalid/help requested.
 */
function parseArgs(): ComparisonConfig | null {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return null;
  }

  const config: Partial<ComparisonConfig> = {
    sampleSize: 100, // Default
  };

  for (const arg of args) {
    if (arg.startsWith('--v1=')) {
      config.v1Url = arg.substring('--v1='.length);
    } else if (arg.startsWith('--v2=')) {
      config.v2Url = arg.substring('--v2='.length);
    } else if (arg.startsWith('--v1-secret=')) {
      config.v1Secret = arg.substring('--v1-secret='.length);
    } else if (arg.startsWith('--v2-secret=')) {
      config.v2Secret = arg.substring('--v2-secret='.length);
    } else if (arg.startsWith('--entities=')) {
      const entitiesStr = arg.substring('--entities='.length);
      config.entities = entitiesStr.split(',').map((s) => s.trim());
    } else if (arg.startsWith('--sample-size=')) {
      const sizeStr = arg.substring('--sample-size='.length);
      const size = parseInt(sizeStr, 10);
      if (!isNaN(size) && size > 0) {
        config.sampleSize = size;
      }
    }
  }

  // Validate required arguments
  if (!config.v1Url || !config.v2Url) {
    console.error('Error: Both --v1 and --v2 URLs are required.\n');
    printUsage();
    return null;
  }

  return config as ComparisonConfig;
}

/**
 * Print usage information.
 */
function printUsage(): void {
  console.log(`
Usage: pnpm compare --v1=<url> --v2=<url> [options]

Compare row counts and sampled content between V1 and V2 Hasura endpoints.

Options:
  --v1=<url>           V1 Hasura GraphQL endpoint (required)
  --v2=<url>           V2 Hasura GraphQL endpoint (required)
  --v1-secret=<secret> V1 Hasura admin secret (optional)
  --v2-secret=<secret> V2 Hasura admin secret (optional)
  --entities=<list>    Comma-separated entity names to compare (default: all)
  --sample-size=<n>    Number of rows to sample per entity (default: 100)
  --help, -h           Show this help message

Examples:
  # Compare all entities between two endpoints
  pnpm compare --v1=https://v1.example.com/v1/graphql --v2=https://v2.example.com/v1/graphql

  # Compare specific entities only
  pnpm compare --v1=URL --v2=URL --entities=UniversalProfile,DigitalAsset,NFT

  # Use with admin secrets
  pnpm compare --v1=URL --v2=URL --v1-secret=secret1 --v2-secret=secret2

Exit codes:
  0 - All comparisons passed
  1 - Comparison failed or error occurred
`);
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
  try {
    const config = parseArgs();

    if (!config) {
      process.exit(1);
    }

    // Run comparison
    const report = await runComparison(config);

    // Print results
    printReport(report);

    // Exit with appropriate code
    process.exit(report.passed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Comparison failed with error:');
    if (error instanceof Error) {
      console.error(`   ${error.message}\n`);
    } else {
      console.error(`   ${String(error)}\n`);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
