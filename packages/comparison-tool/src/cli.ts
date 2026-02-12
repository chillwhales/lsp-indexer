#!/usr/bin/env ts-node

import { runComparison } from './comparisonEngine';
import { ENTITY_REGISTRY } from './entityRegistry';
import { printReport } from './reporter';
import { ComparisonConfig, ComparisonMode } from './types';

function parseArgs(): ComparisonConfig | null {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return null;
  }

  const config: Partial<ComparisonConfig> & { mode: ComparisonMode } = {
    mode: 'v1-v2',
    sampleSize: 100,
    tolerancePercent: 0,
  };

  for (const arg of args) {
    if (arg.startsWith('--source=')) {
      config.sourceUrl = arg.substring('--source='.length);
    } else if (arg.startsWith('--target=')) {
      config.targetUrl = arg.substring('--target='.length);
    } else if (arg.startsWith('--v1=')) {
      config.sourceUrl = arg.substring('--v1='.length);
    } else if (arg.startsWith('--v2=')) {
      config.targetUrl = arg.substring('--v2='.length);
    } else if (arg.startsWith('--source-secret=')) {
      config.sourceSecret = arg.substring('--source-secret='.length);
    } else if (arg.startsWith('--target-secret=')) {
      config.targetSecret = arg.substring('--target-secret='.length);
    } else if (arg.startsWith('--v1-secret=')) {
      config.sourceSecret = arg.substring('--v1-secret='.length);
    } else if (arg.startsWith('--v2-secret=')) {
      config.targetSecret = arg.substring('--v2-secret='.length);
    } else if (arg.startsWith('--mode=')) {
      const mode = arg.substring('--mode='.length);
      if (mode === 'v1-v2' || mode === 'v2-v2') {
        config.mode = mode;
      } else {
        console.error(`Error: Invalid mode "${mode}". Use "v1-v2" or "v2-v2".\n`);
        return null;
      }
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

  return config as ComparisonConfig;
}

function printUsage(): void {
  console.log(`
Usage: pnpm compare -- [options]

Compare row counts and sampled content between two Hasura GraphQL endpoints.

Endpoint options (pick one style):
  --v1=<url>              Source endpoint (v1-v2 mode naming)
  --v2=<url>              Target endpoint (v1-v2 mode naming)
  --source=<url>          Source endpoint (generic naming)
  --target=<url>          Target endpoint (generic naming)

Authentication:
  --v1-secret=<secret>    Source admin secret (or --source-secret)
  --v2-secret=<secret>    Target admin secret (or --target-secret)

Comparison options:
  --mode=<mode>           v1-v2 (default) or v2-v2
  --entities=<list>       Comma-separated entity names (default: all)
  --sample-size=<n>       Rows to sample per entity (default: 100)
  --tolerance=<percent>   Acceptable count diff percentage (default: 0)
  --help, -h              Show this help message

Modes:
  v1-v2   Cross-version comparison. Known divergences (null FKs, token format)
          are reported separately and don't affect the verdict.
  v2-v2   Redundancy comparison. Any difference is flagged as a failure.
          No known divergences apply.

Examples:
  # V1 vs V2 comparison
  pnpm compare -- --v1=https://v1.example.com/v1/graphql --v2=https://v2.example.com/v1/graphql

  # V2 vs V2 redundancy check with 2% tolerance
  pnpm compare -- --mode=v2-v2 --source=https://v2a.example.com/v1/graphql \\
    --target=https://v2b.example.com/v1/graphql --tolerance=2

  # Specific entities with secrets
  pnpm compare -- --v1=URL --v2=URL --v1-secret=s1 --v2-secret=s2 \\
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
