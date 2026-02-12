import { ENTITY_REGISTRY } from './entityRegistry';
import { ComparisonReport, RowDiff } from './types';

// ANSI escape codes for colored terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

/**
 * Format a number with comma separators (e.g., 1234 → 1,234)
 */
function formatNumber(num: number): string {
  if (num === -1) return 'N/A';
  return num.toLocaleString('en-US');
}

/**
 * Truncate a string value to max length with ellipsis.
 */
function truncateValue(value: unknown, maxLength: number = 60): string {
  const str = JSON.stringify(value);
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Print a colored, structured comparison report to stdout.
 */
export function printReport(report: ComparisonReport): void {
  // Header
  console.log(`\n${BOLD}${'═'.repeat(55)}${RESET}`);
  console.log(`${BOLD}${CYAN}  V1 vs V2 Data Parity Comparison${RESET}`);
  console.log(`${BOLD}${'═'.repeat(55)}${RESET}\n`);

  // Missing Entity Types
  if (report.missingEntityTypes.length > 0) {
    console.log(`${BOLD}Missing Entity Types:${RESET}`);
    const v1Missing = report.missingEntityTypes.filter((m) => m.endpoint === 'v1');
    const v2Missing = report.missingEntityTypes.filter((m) => m.endpoint === 'v2');

    if (v1Missing.length > 0) {
      console.log(`${DIM}  V1 missing: ${v1Missing.map((m) => m.entityName).join(', ')}${RESET}`);
    }
    if (v2Missing.length > 0) {
      console.log(`${RED}  V2 missing: ${v2Missing.map((m) => m.entityName).join(', ')}${RESET}`);
    }
    console.log();
  }

  // Row Counts Table
  console.log(`${BOLD}Row Counts:${RESET}`);
  console.log(`${DIM}${'─'.repeat(70)}${RESET}`);
  console.log(
    `${'Entity Type'.padEnd(30)} ${'V1 Count'.padStart(12)} ${'V2 Count'.padStart(12)}  Status`,
  );
  console.log(`${DIM}${'─'.repeat(70)}${RESET}`);

  for (const count of report.counts) {
    // Check if this is a metadata sub-entity
    const entity = ENTITY_REGISTRY.find((e) => e.name === count.entityName);
    const isMetadataSub = entity?.isMetadataSub ?? false;

    const entityName = isMetadataSub ? `${count.entityName}*` : count.entityName;
    const v1CountStr = formatNumber(count.v1Count);
    const v2CountStr = formatNumber(count.v2Count);

    let statusSymbol: string;
    let statusColor: string;

    if (count.match) {
      statusSymbol = '✓ MATCH';
      statusColor = GREEN;
    } else if (isMetadataSub) {
      statusSymbol = '~ METADATA';
      statusColor = YELLOW;
    } else {
      statusSymbol = '✗ MISMATCH';
      statusColor = RED;
    }

    console.log(
      `${entityName.padEnd(30)} ${v1CountStr.padStart(12)} ${v2CountStr.padStart(12)}  ${statusColor}${statusSymbol}${RESET}`,
    );
  }

  console.log(`${DIM}${'─'.repeat(70)}${RESET}\n`);

  // Sampled Content Diffs
  if (report.sampleDiffs.length > 0) {
    // Group diffs by entity type
    const diffsByEntity = new Map<string, RowDiff[]>();
    for (const diff of report.sampleDiffs) {
      const existing = diffsByEntity.get(diff.entityName) || [];
      existing.push(diff);
      diffsByEntity.set(diff.entityName, existing);
    }

    // Separate unexpected diffs from known divergences
    const entitiesWithUnexpectedDiffs = Array.from(diffsByEntity.entries()).filter(([_, diffs]) =>
      diffs.some((d) => d.unexpectedDiffs.length > 0),
    );

    const entitiesWithKnownOnly = Array.from(diffsByEntity.entries()).filter(([_, diffs]) =>
      diffs.every((d) => d.unexpectedDiffs.length === 0),
    );

    // Print unexpected diffs first (these are failures)
    if (entitiesWithUnexpectedDiffs.length > 0) {
      console.log(`${BOLD}${RED}Unexpected Content Differences:${RESET}`);

      for (const [entityName, diffs] of entitiesWithUnexpectedDiffs) {
        const diffsWithUnexpected = diffs.filter((d) => d.unexpectedDiffs.length > 0);
        console.log(
          `\n${BOLD}${RED}─── ${entityName} (${diffsWithUnexpected.length} row${diffsWithUnexpected.length === 1 ? '' : 's'} with diffs) ───${RESET}`,
        );

        for (const diff of diffsWithUnexpected.slice(0, 5)) {
          // Limit to 5 rows per entity
          console.log(`\n  ${DIM}Row: ${diff.rowId}${RESET}`);
          for (const fieldDiff of diff.unexpectedDiffs) {
            const v1Str = truncateValue(fieldDiff.v1Value);
            const v2Str = truncateValue(fieldDiff.v2Value);
            console.log(`    ${fieldDiff.field}: ${v1Str} ${RED}→${RESET} ${v2Str}`);
          }
        }

        if (diffsWithUnexpected.length > 5) {
          console.log(`  ${DIM}... and ${diffsWithUnexpected.length - 5} more rows${RESET}`);
        }
      }
      console.log();
    }

    // Print known divergences (these are expected)
    if (entitiesWithKnownOnly.length > 0) {
      console.log(`${BOLD}${DIM}Known Divergences:${RESET}`);

      for (const [entityName, diffs] of entitiesWithKnownOnly) {
        console.log(
          `\n${DIM}─── ${entityName} (${diffs.length} row${diffs.length === 1 ? '' : 's'}) ───${RESET}`,
        );

        for (const diff of diffs.slice(0, 3)) {
          // Limit to 3 rows per entity
          console.log(`\n  ${DIM}Row: ${diff.rowId}${RESET}`);
          for (const fieldDiff of diff.knownDivergences) {
            const v1Str = truncateValue(fieldDiff.v1Value);
            const v2Str = truncateValue(fieldDiff.v2Value);
            console.log(`    ${fieldDiff.field}: ${v1Str} → ${v2Str}`);
          }
        }

        if (diffs.length > 3) {
          console.log(`  ${DIM}... and ${diffs.length - 3} more rows${RESET}`);
        }
      }
      console.log();
    }
  }

  // Summary
  console.log(`${BOLD}${'═'.repeat(55)}${RESET}`);

  const resultColor = report.passed ? GREEN : RED;
  const resultText = report.passed ? 'PASS ✓' : 'FAIL ✗';
  console.log(`${BOLD}${resultColor}RESULT: ${resultText}${RESET}`);

  console.log(`${BOLD}${'═'.repeat(55)}${RESET}`);

  const entityTypesCompared = report.counts.length;
  const countMatches = report.counts.filter((c) => c.match).length;
  const metadataTimingDiffs = report.counts.filter((c) => {
    if (c.match) return false;
    const entity = ENTITY_REGISTRY.find((e) => e.name === c.entityName);
    return entity?.isMetadataSub ?? false;
  }).length;

  const totalUnexpectedDiffs = report.sampleDiffs.reduce(
    (sum, diff) => sum + diff.unexpectedDiffs.length,
    0,
  );

  const totalKnownDivergences = report.sampleDiffs.reduce(
    (sum, diff) => sum + diff.knownDivergences.length,
    0,
  );

  console.log(`Entity types compared: ${entityTypesCompared}`);
  console.log(
    `Row count matches: ${countMatches}/${entityTypesCompared}${metadataTimingDiffs > 0 ? `  (${metadataTimingDiffs} metadata timing)` : ''}`,
  );
  console.log(
    `Unexpected diffs: ${totalUnexpectedDiffs > 0 ? `${RED}${totalUnexpectedDiffs}${RESET}` : '0'}`,
  );
  console.log(`Known divergences: ${DIM}${totalKnownDivergences}${RESET}`);
  console.log(`${BOLD}${'═'.repeat(55)}${RESET}\n`);
}
