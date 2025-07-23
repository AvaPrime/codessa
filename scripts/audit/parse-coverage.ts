import fs from 'fs';

interface CoverageMetrics {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}

interface FileCoverage {
    lines: CoverageMetrics;
    functions: CoverageMetrics;
    statements: CoverageMetrics;
    branches: CoverageMetrics;
}

interface CoverageResult {
    total: FileCoverage;
    [filePath: string]: FileCoverage | any;
}

interface CoverageGap {
    filePath: string;
    uncoveredLines: number;
    uncoveredBranches: number;
    coveragePercentage: number;
}


interface CoverageGapsReport {
    summary: {
        totalFiles: number;
        filesWithGaps: number;
        overallLineCoverage: number;
        overallBranchCoverage: number;
        totalUncoveredLines: number;
        totalUncoveredBranches: number;
    };
    gaps: CoverageGap[];
    mostProblematicFiles: CoverageGap[];
    timestamp: string;
}

export async function parseCoverageResults(coveragePath: string): Promise<CoverageGapsReport> {
    const coverageData: CoverageResult = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const coverageGaps: CoverageGap[] = [];
    
    // Extract overall totals
    const totalCoverage = coverageData.total;
    
    Object.keys(coverageData).forEach(filePath => {
        if (filePath === 'total') return;
        const fileCoverage = coverageData[filePath] as FileCoverage;
        const uncoveredLines = fileCoverage.lines.total - fileCoverage.lines.covered;
        const uncoveredBranches = fileCoverage.branches.total - fileCoverage.branches.covered;
        const coveragePercentage = fileCoverage.lines.pct;

        // Flag gaps - files with less than 100% coverage
        if (coveragePercentage < 100 || uncoveredBranches > 0) {
            coverageGaps.push({
                filePath,
                uncoveredLines,
                uncoveredBranches,
                coveragePercentage
            });
        }
    });

    // Sort by coverage percentage (worst first)
    coverageGaps.sort((a, b) => a.coveragePercentage - b.coveragePercentage);
    
    // Get most problematic files (bottom 10 or all if less than 10)
    const mostProblematicFiles = coverageGaps.slice(0, Math.min(10, coverageGaps.length));
    
    const report: CoverageGapsReport = {
        summary: {
            totalFiles: Object.keys(coverageData).length - 1, // -1 for 'total' key
            filesWithGaps: coverageGaps.length,
            overallLineCoverage: totalCoverage.lines.pct,
            overallBranchCoverage: totalCoverage.branches.pct,
            totalUncoveredLines: totalCoverage.lines.total - totalCoverage.lines.covered,
            totalUncoveredBranches: totalCoverage.branches.total - totalCoverage.branches.covered
        },
        gaps: coverageGaps,
        mostProblematicFiles,
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync('coverage-gaps.json', JSON.stringify(report, null, 2));
    console.log(`✅ Coverage gaps analysis complete! Found ${coverageGaps.length} files with coverage gaps.`);
    console.log(`📊 Overall line coverage: ${totalCoverage.lines.pct}%`);
    console.log(`🌿 Overall branch coverage: ${totalCoverage.branches.pct}%`);
    console.log(`📄 Report written to coverage-gaps.json`);
    
    return report;
}

export async function generateCoverageSummary(report: CoverageGapsReport): Promise<string> {
    let summary = `Coverage Gaps Analysis Report\n`;
    summary += `Generated: ${report.timestamp}\n\n`;
    
    summary += `📊 Summary:\n`;
    summary += `  Total Files: ${report.summary.totalFiles}\n`;
    summary += `  Files with Gaps: ${report.summary.filesWithGaps}\n`;
    summary += `  Overall Line Coverage: ${report.summary.overallLineCoverage.toFixed(2)}%\n`;
    summary += `  Overall Branch Coverage: ${report.summary.overallBranchCoverage.toFixed(2)}%\n`;
    summary += `  Total Uncovered Lines: ${report.summary.totalUncoveredLines}\n`;
    summary += `  Total Uncovered Branches: ${report.summary.totalUncoveredBranches}\n\n`;
    
    if (report.mostProblematicFiles.length > 0) {
        summary += `🔴 Most Problematic Files:\n`;
        report.mostProblematicFiles.forEach((gap, index) => {
            summary += `  ${index + 1}. ${gap.filePath}\n`;
            summary += `     Coverage: ${gap.coveragePercentage.toFixed(2)}%\n`;
            summary += `     Uncovered Lines: ${gap.uncoveredLines}\n`;
            summary += `     Uncovered Branches: ${gap.uncoveredBranches}\n\n`;
        });
    }
    
    return summary;
}

// CLI functionality
if (require.main === module) {
    const args = process.argv.slice(2);
    const coverageFile = args[0] || 'coverage/coverage-summary.json';
    
    if (!fs.existsSync(coverageFile)) {
        console.error(`❌ Coverage file not found: ${coverageFile}`);
        console.log('💡 Usage: ts-node parse-coverage.ts [coverage-file-path]');
        console.log('   Default: coverage/coverage-summary.json');
        process.exit(1);
    }
    
    console.log(`🔍 Parsing coverage file: ${coverageFile}`);
    
    parseCoverageResults(coverageFile)
        .then(async (report) => {
            const summary = await generateCoverageSummary(report);
            console.log('\n' + summary);
        })
        .catch((error) => {
            console.error('❌ Error parsing coverage:', error.message);
            process.exit(1);
        });
}
