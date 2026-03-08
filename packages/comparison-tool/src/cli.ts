#!/usr/bin/env ts-node

import { runComparison } from './comparisonEngine';
import { ENTITY_REGISTRY } from './entityRegistry';
import { printReport } from './reporter';
import { ComparisonConfig } from './types';

function parseArgs(): ComparisonConfig | null {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return null;
  }

  const config: Partial<ComparisonConfig> = {
    sampleSize: 100,
    tolerancePercent: 0,
  };

  for (const arg of args) {
    if (arg.startsWith('--source=')) {
      config.sourceUrl = arg.substring('--source='.length);
    } else if (arg.startsWith('--target=')) {
      config.targetUrl = arg.substring('--target='.length);
    } else if (arg.startsWith('--source-secret=')) {
      config.sourceSecret = arg.substring('--source-secret='.length);
    } else if (arg.startsWith('--target-secret=')) {
      config.targetSecret = arg.substring('--target-secret='.length);
    } else if (arg.startsWith('--entities=')) {
      const entityNames = arg
        .substring('--entities='.length)
        .split(',')
        .map((s) => s.trim());
      const knownNames = new Set(ENTITY_REGISTRY.map((e) => e.name));
      const unknown = entityNames.filter((n) => !knownNames.has(n));
      if (unknown.length > 0) {
        console.error(`Error: Unknown entity name(s): ${unknown.join(', ')}\n`);
        console.error(`Available entities: ${ENTITY_REGISTRY.map((e) => e.name).join(', ')}\n`);
        return null;
      }
      config.entities = entityNames;
    } else if (arg.startsWith('--sample-size=')) {
      const size = parseInt(arg.substring('--sample-size='.length), 10);
      if (!isNaN(size) && size > 0) config.sampleSize = size;
    } else if (arg.startsWith('--tolerance=')) {
      const tol = parseFloat(arg.substring('--tolerance='.length));
      if (!isNaN(tol) && tol >= 0) config.tolerancePercent = tol;
    }
  }

  if (!config.sourceUrl || !config.targetUrl) {
    console.error('Error: Both source and target URLs are required.\n');
    printUsage();
    return null;
  }

  return {
    sourceUrl: config.sourceUrl,
    targetUrl: config.targetUrl,
    sourceSecret: config.sourceSecret,
    targetSecret: config.targetSecret,
    entities: config.entities,
    sampleSize: config.sampleSize ?? 100,
    tolerancePercent: config.tolerancePercent ?? 0,
  };
}

function printUsage(): void {
  console.info(`
Usage: pnpm compare -- [options]

Compare row counts and sampled content between two Hasura GraphQL endpoints.

Endpoint options:
  --source=<url>          Source endpoint
  --target=<url>          Target endpoint

Authentication:
  --source-secret=<secret>  Source admin secret
  --target-secret=<secret>  Target admin secret

Comparison options:
  --entities=<list>       Comma-separated entity names (default: all)
  --sample-size=<n>       Rows to sample per entity (default: 100)
  --tolerance=<percent>   Acceptable count diff percentage (default: 0)
  --help, -h              Show this help message

Examples:
  # Compare two endpoints
  pnpm compare -- --source=https://a.example.com/v1/graphql --target=https://b.example.com/v1/graphql

  # With 2% count tolerance
  pnpm compare -- --source=https://a.example.com/v1/graphql \\
    --target=https://b.example.com/v1/graphql --tolerance=2

  # Specific entities with secrets
  pnpm compare -- --source=URL --target=URL --source-secret=s1 --target-secret=s2 \\
    --entities=UniversalProfile,DigitalAsset,NFT

Exit codes:
  0 - All comparisons passed (within tolerance)
  1 - Comparison failed or error occurred
`);
}

async function main(): Promise<void> {
  try {
    const config = parseArgs();
    if (!config) {
      // --help returns null but should exit 0; errors already printed for other cases
      const isHelp = process.argv.slice(2).some((a) => a === '--help' || a === '-h');
      process.exit(isHelp ? 0 : 1);
    }

    const report = await runComparison(config);
    printReport(report);
    process.exit(report.passed ? 0 : 1);
  } catch (error) {
    console.error('\nComparison failed:');
    if (error instanceof Error) {
      console.error(`  ${error.message}\n`);
    } else {
      console.error(`  ${String(error)}\n`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
