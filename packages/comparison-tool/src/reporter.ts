import { ENTITY_REGISTRY } from './entityRegistry';
import { ComparisonReport, RowDiff } from './types';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

function formatNumber(num: number): string {
  if (num === -1) return 'N/A';
  return num.toLocaleString('en-US');
}

function truncateValue(value: unknown, maxLength: number = 60): string {
  const str = value === undefined ? 'undefined' : (JSON.stringify(value) ?? 'undefined');
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function formatPercent(pct: number): string {
  if (pct === 0) return '';
  return `(${pct < 0.01 ? '<0.01' : pct.toFixed(2)}%)`;
}

export function printReport(report: ComparisonReport): void {
  const { sourceLabel, targetLabel } = report;

  // Header
  console.info(`\n${BOLD}${'═'.repeat(70)}${RESET}`);
  console.info(`${BOLD}${CYAN}  ${sourceLabel} vs ${targetLabel} Data Parity Comparison${RESET}`);
  if (report.tolerancePercent > 0) {
    console.info(
      `${DIM}  Tolerance: ${report.tolerancePercent}% count difference accepted${RESET}`,
    );
  }
  console.info(`${BOLD}${'═'.repeat(70)}${RESET}\n`);

  // Missing Entity Types
  if (report.missingEntityTypes.length > 0) {
    console.info(`${BOLD}Missing Entity Types:${RESET}`);
    const sourceMissing = report.missingEntityTypes.filter((m) => m.endpoint === 'source');
    const targetMissing = report.missingEntityTypes.filter((m) => m.endpoint === 'target');

    if (sourceMissing.length > 0) {
      console.info(
        `${DIM}  ${sourceLabel} missing: ${sourceMissing.map((m) => m.entityName).join(', ')}${RESET}`,
      );
    }
    if (targetMissing.length > 0) {
      console.info(
        `${RED}  ${targetLabel} missing: ${targetMissing.map((m) => m.entityName).join(', ')}${RESET}`,
      );
    }
    console.info();
  }

  // Row Counts Table
  const srcHeader = `${sourceLabel} Count`;
  const tgtHeader = `${targetLabel} Count`;

  console.info(`${BOLD}Row Counts:${RESET}`);
  console.info(`${DIM}${'─'.repeat(80)}${RESET}`);
  console.info(
    `${'Entity Type'.padEnd(35)} ${srcHeader.padStart(12)} ${tgtHeader.padStart(12)}  ${'Diff'.padStart(8)}  Status`,
  );
  console.info(`${DIM}${'─'.repeat(80)}${RESET}`);

  for (const count of report.counts) {
    const entity = ENTITY_REGISTRY.find((e) => e.name === count.entityName);
    const isMetadataSub = entity?.isMetadataSub ?? false;

    const entityName = isMetadataSub ? `${count.entityName}*` : count.entityName;
    const srcStr = formatNumber(count.sourceCount);
    const tgtStr = formatNumber(count.targetCount);
    const diffStr = count.match ? '' : formatPercent(count.diffPercent);

    let statusSymbol: string;
    let statusColor: string;

    if (count.match) {
      statusSymbol = '✓ MATCH';
      statusColor = GREEN;
    } else if (isMetadataSub) {
      statusSymbol = '~ METADATA';
      statusColor = YELLOW;
    } else if (count.withinTolerance) {
      statusSymbol = '≈ TOLERANCE';
      statusColor = YELLOW;
    } else {
      statusSymbol = '✗ MISMATCH';
      statusColor = RED;
    }

    console.info(
      `${entityName.padEnd(35)} ${srcStr.padStart(12)} ${tgtStr.padStart(12)}  ${diffStr.padStart(8)}  ${statusColor}${statusSymbol}${RESET}`,
    );
  }

  console.info(`${DIM}${'─'.repeat(80)}${RESET}\n`);

  // Sampled Content Diffs
  if (report.sampleDiffs.length > 0) {
    const diffsByEntity = new Map<string, RowDiff[]>();
    for (const diff of report.sampleDiffs) {
      const existing = diffsByEntity.get(diff.entityName) || [];
      existing.push(diff);
      diffsByEntity.set(diff.entityName, existing);
    }

    console.info(`${BOLD}${RED}Content Differences:${RESET}`);

    for (const [entityName, diffs] of diffsByEntity) {
      console.info(
        `\n${BOLD}${RED}─── ${entityName} (${diffs.length} row${diffs.length === 1 ? '' : 's'} with diffs) ───${RESET}`,
      );

      for (const diff of diffs.slice(0, 5)) {
        console.info(`\n  ${DIM}Row: ${diff.rowId}${RESET}`);
        for (const fieldDiff of diff.diffs) {
          const srcStr = truncateValue(fieldDiff.sourceValue);
          const tgtStr = truncateValue(fieldDiff.targetValue);
          console.info(`    ${fieldDiff.field}: ${srcStr} ${RED}→${RESET} ${tgtStr}`);
        }
      }

      if (diffs.length > 5) {
        console.info(`  ${DIM}... and ${diffs.length - 5} more rows${RESET}`);
      }
    }
    console.info();
  }

  // FK Coverage
  const fkOrphans = report.fkCoverage.filter((r) => r.orphanedNullCount > 0);
  const fkClean = report.fkCoverage.filter((r) => r.orphanedNullCount === 0 && r.nullFkCount > 0);

  if (report.fkCoverage.length > 0) {
    console.info(`${BOLD}FK Coverage Validation:${RESET}`);
    console.info(`${DIM}${'─'.repeat(80)}${RESET}`);

    if (fkOrphans.length > 0) {
      for (const result of fkOrphans) {
        console.info(
          `  ${RED}✗${RESET} ${result.endpoint} ${result.rule}: ` +
            `${RED}${result.orphanedNullCount}${RESET} orphaned nulls ` +
            `(${result.nullFkCount} sampled with null FK, target entity exists)`,
        );
        if (result.orphanedSampleIds.length > 0) {
          console.info(`    ${DIM}Sample IDs: ${result.orphanedSampleIds.join(', ')}${RESET}`);
        }
      }
    }

    if (fkClean.length > 0) {
      for (const result of fkClean) {
        console.info(
          `  ${GREEN}✓${RESET} ${result.endpoint} ${result.rule}: ` +
            `${result.nullFkCount} null FKs, all targets missing (correct)`,
        );
      }
    }

    const fkFullyCovered = report.fkCoverage.filter((r) => r.nullFkCount === 0);
    if (fkFullyCovered.length > 0) {
      for (const result of fkFullyCovered) {
        console.info(
          `  ${GREEN}✓${RESET} ${result.endpoint} ${result.rule}: ` +
            `fully populated (no null FKs)`,
        );
      }
    }

    console.info(`${DIM}${'─'.repeat(80)}${RESET}\n`);
  }

  // Summary
  console.info(`${BOLD}${'═'.repeat(70)}${RESET}`);

  const resultColor = report.passed ? GREEN : RED;
  const resultText = report.passed ? 'PASS ✓' : 'FAIL ✗';
  console.info(`${BOLD}${resultColor}RESULT: ${resultText}${RESET}`);

  console.info(`${BOLD}${'═'.repeat(70)}${RESET}`);

  const entityTypesCompared = report.counts.length;
  const exactMatches = report.counts.filter((c) => c.match).length;
  const toleranceMatches = report.counts.filter((c) => !c.match && c.withinTolerance).length;
  const metadataTimingDiffs = report.counts.filter((c) => {
    if (c.match) return false;
    const e = ENTITY_REGISTRY.find((ent) => ent.name === c.entityName);
    return e?.isMetadataSub ?? false;
  }).length;

  const totalDiffs = report.sampleDiffs.reduce((sum, diff) => sum + diff.diffs.length, 0);

  console.info(`Entity types compared: ${entityTypesCompared}`);
  console.info(
    `Row count exact matches: ${exactMatches}/${entityTypesCompared}` +
      (toleranceMatches > 0 ? `  (+${toleranceMatches} within tolerance)` : '') +
      (metadataTimingDiffs > 0 ? `  (${metadataTimingDiffs} metadata timing)` : ''),
  );
  if (report.tolerancePercent > 0) {
    console.info(`Tolerance: ${report.tolerancePercent}%`);
  }
  console.info(`Content diffs: ${totalDiffs > 0 ? `${RED}${totalDiffs}${RESET}` : '0'}`);

  const totalOrphans = report.fkCoverage.reduce((sum, r) => sum + r.orphanedNullCount, 0);
  console.info(
    `FK coverage orphans: ${totalOrphans > 0 ? `${RED}${totalOrphans}${RESET}` : `${GREEN}0${RESET}`}`,
  );

  console.info(`${BOLD}${'═'.repeat(70)}${RESET}\n`);
}
