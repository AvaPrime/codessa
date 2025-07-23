import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface ESLintResult {
  filePath: string;
  messages: { ruleId: string | null; severity: number; }[];
}

interface ParsedESLintData {
  totalErrors: number;
  totalWarnings: number;
  files: string[];
  summary: { [filePath: string]: { errors: number; warnings: number; status: string; } };
}

const readESLintFiles = (inputPath: string): ESLintResult[] => {
  // Validate input directory exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input directory does not exist: ${inputPath}`);
  }
  
  const files = fs.readdirSync(inputPath).filter(file => file.startsWith('eslint-') && file.endsWith('.json'));
  
  if (files.length === 0) {
    console.warn(`No ESLint JSON files found in ${inputPath}`);
    return [];
  }
  
  let results: ESLintResult[] = [];

  files.forEach(file => {
    const filePath = path.join(inputPath, file);
    const data: ESLintResult[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    results = results.concat(data);
  });

  return results;
};

const aggregateResults = (results: ESLintResult[]): ParsedESLintData => {
  const summary: { [filePath: string]: { errors: number; warnings: number; status: string; } } = {};
  let totalErrors = 0;
  let totalWarnings = 0;

  results.forEach(result => {
    const errors = result.messages.filter(msg => msg.severity === 2).length;
    const warnings = result.messages.filter(msg => msg.severity === 1).length;
    
    // Classify status based on errors and warnings
    const status = errors === 0 && warnings === 0 
      ? 'Compliant' 
      : errors > 0 
        ? 'Needs Refactor' 
        : 'Warning';
    
    totalErrors += errors;
    totalWarnings += warnings;
    summary[result.filePath] = { errors, warnings, status };
  });

  // Sort files by error count (descending) for prioritization
  const sortedFiles = Object.keys(summary).sort((a, b) => 
    summary[b].errors - summary[a].errors || summary[b].warnings - summary[a].warnings
  );

  return { totalErrors, totalWarnings, files: sortedFiles, summary };
};

const writeSummary = (outputPath: string, parsedData: ParsedESLintData) => {
  const date = new Date().toISOString().split('T')[0];
  const outputDir = path.join(outputPath, date);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'eslint-summary.json');
  fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2));
  
  console.log(`ESLint summary written to ${outputFile}`);
  console.log(`Parsed ${parsedData.files.length} files with ${parsedData.totalErrors} errors and ${parsedData.totalWarnings} warnings.`);
};

const run = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      description: 'Input path for ESLint JSON files',
      type: 'string',
      default: '.refactor-audit/artifacts/latest'
    })
    .option('output', {
      alias: 'o', 
      description: 'Output path for ESLint summary',
      type: 'string',
      default: '.refactor-audit/artifacts'
    })
    .help()
    .argv;

  try {
    const results = readESLintFiles(argv.input);
    const parsedData = aggregateResults(results);
    writeSummary(argv.output, parsedData);
  } catch (err) {
    console.error('Error processing ESLint files:', err);
    process.exit(1);
  }
};

run();

/**
 * Parse ESLint results and extract relevant metrics
 */

// TODO: Define input types for ESLint output format
interface ESLintResult {
  // TODO: Add ESLint result structure
}

interface ParsedESLintData {
  // TODO: Define parsed output structure
  // - Total errors count
  // - Total warnings count  
  // - Files with issues
  // - Rule violations breakdown
  // - Severity distribution
}

/**
 * Parse ESLint JSON output and extract key metrics
 * 
 * TODO: Inputs required:
 * - ESLint JSON output file path or raw JSON data
 * - Optional: filtering options (specific rules, severity levels)
 * 
 * TODO: Outputs:
 * - Parsed metrics object with error/warning counts
 * - File-level breakdown of issues
 * - Rule violation statistics
 * - Trend data if comparing multiple runs
 */
export async function parseESLintResults(
  eslintOutput: string | ESLintResult[]
): Promise<ParsedESLintData> {
  // TODO: Implement ESLint parsing logic
  // - Parse JSON output from ESLint
  // - Extract error/warning counts
  // - Group by file, rule, severity
  // - Calculate metrics and trends
  
  throw new Error('parseESLintResults not implemented yet');
}

/**
 * Generate summary report from parsed ESLint data
 * 
 * TODO: Generate human-readable summary
 * - Overall health score
 * - Top violated rules
 * - Most problematic files
 */
export async function generateESLintSummary(
  parsedData: ParsedESLintData
): Promise<string> {
  // TODO: Implement summary generation
  throw new Error('generateESLintSummary not implemented yet');
}
