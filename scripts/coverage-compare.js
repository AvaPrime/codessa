#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to manage baseline vs new coverage comparison
 *
 * Usage:
 *   node scripts/coverage-compare.js baseline    # Generate baseline coverage
 *   node scripts/coverage-compare.js new        # Generate new coverage
 *   node scripts/coverage-compare.js compare    # Compare baseline vs new
 *   node scripts/coverage-compare.js clean      # Clean all coverage directories
 */

const BASELINE_DIR = 'coverage-baseline';
const NEW_DIR = 'coverage-new';
const DEFAULT_DIR = 'coverage';

function ensureDirectories() {
  const dirs = [BASELINE_DIR, NEW_DIR, DEFAULT_DIR];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function runCoverage(type) {
  const commands = {
    baseline: `COVERAGE_DIR=${BASELINE_DIR} npm run test:coverage`,
    new: `COVERAGE_DIR=${NEW_DIR} npm run test:coverage`,
    default: 'npm run test:coverage',
  };

  try {
    console.log(`🧪 Generating ${type} coverage...`);
    execSync(commands[type] || commands.default, {
      stdio: 'inherit',
      env: {
        ...process.env,
        COVERAGE_DIR:
          type === 'baseline'
            ? BASELINE_DIR
            : type === 'new'
              ? NEW_DIR
              : DEFAULT_DIR,
      },
    });
    console.log(
      `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} coverage generated successfully`,
    );
  } catch (error) {
    console.error(`❌ Failed to generate ${type} coverage:`, error.message);
    process.exit(1);
  }
}

function compareCoverage() {
  const baselineSummary = path.join(BASELINE_DIR, 'coverage-summary.json');
  const newSummary = path.join(NEW_DIR, 'coverage-summary.json');

  if (!fs.existsSync(baselineSummary)) {
    console.error(
      '❌ Baseline coverage not found. Run: node scripts/coverage-compare.js baseline',
    );
    process.exit(1);
  }

  if (!fs.existsSync(newSummary)) {
    console.error(
      '❌ New coverage not found. Run: node scripts/coverage-compare.js new',
    );
    process.exit(1);
  }

  try {
    const baseline = JSON.parse(fs.readFileSync(baselineSummary, 'utf8'));
    const newCov = JSON.parse(fs.readFileSync(newSummary, 'utf8'));

    console.log('\n📊 Coverage Comparison Report');
    console.log('==============================\n');

    const metrics = ['lines', 'functions', 'branches', 'statements'];

    metrics.forEach((metric) => {
      const baselineTotal = baseline.total[metric];
      const newTotal = newCov.total[metric];

      const baselinePct = baselineTotal.pct;
      const newPct = newTotal.pct;
      const diff = newPct - baselinePct;

      const indicator = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      const diffStr = diff > 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`;

      console.log(
        `${indicator} ${metric.charAt(0).toUpperCase() + metric.slice(1)}:`,
      );
      console.log(
        `   Baseline: ${baselinePct}% (${baselineTotal.covered}/${baselineTotal.total})`,
      );
      console.log(
        `   New:      ${newPct}% (${newTotal.covered}/${newTotal.total})`,
      );
      console.log(`   Change:   ${diffStr}\n`);
    });

    // Overall summary
    const avgBaseline =
      metrics.reduce((sum, metric) => sum + baseline.total[metric].pct, 0) /
      metrics.length;
    const avgNew =
      metrics.reduce((sum, metric) => sum + newCov.total[metric].pct, 0) /
      metrics.length;
    const avgDiff = avgNew - avgBaseline;

    console.log('🎯 Overall Summary:');
    console.log(`   Average Baseline: ${avgBaseline.toFixed(2)}%`);
    console.log(`   Average New:      ${avgNew.toFixed(2)}%`);
    console.log(
      `   Overall Change:   ${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(2)}%`,
    );

    if (avgDiff > 0) {
      console.log('\n🎉 Coverage improved! ');
    } else if (avgDiff < 0) {
      console.log('\n⚠️  Coverage decreased.');
    } else {
      console.log('\n✅ Coverage remained the same.');
    }
  } catch (error) {
    console.error('❌ Failed to compare coverage:', error.message);
    process.exit(1);
  }
}

function cleanCoverage() {
  const dirs = [BASELINE_DIR, NEW_DIR, DEFAULT_DIR];

  dirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🧹 Cleaned ${dir}/`);
    }
  });

  console.log('✅ All coverage directories cleaned');
}

function showHelp() {
  console.log(`
📋 Coverage Comparison Tool

Usage:
  node scripts/coverage-compare.js <command>

Commands:
  baseline  Generate baseline coverage in ${BASELINE_DIR}/
  new       Generate new coverage in ${NEW_DIR}/
  compare   Compare baseline vs new coverage
  clean     Remove all coverage directories
  help      Show this help message

Example workflow:
  1. node scripts/coverage-compare.js baseline
  2. # Make your changes to the codebase
  3. node scripts/coverage-compare.js new
  4. node scripts/coverage-compare.js compare
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'baseline':
    ensureDirectories();
    runCoverage('baseline');
    break;
  case 'new':
    ensureDirectories();
    runCoverage('new');
    break;
  case 'compare':
    compareCoverage();
    break;
  case 'clean':
    cleanCoverage();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error('❌ Unknown command. Use --help for usage information.');
    process.exit(1);
}
