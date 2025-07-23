#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface DependencyComparison {
  library: string;
  codessaVersion: string | null;
  echoforgeVersion: string | null;
  type: 'dependency' | 'devDependency' | 'both';
  status: 'match' | 'version-mismatch' | 'unique-to-codessa' | 'unique-to-echoforge';
}

function loadPackageJson(filePath: string): PackageJson {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return {};
  }
}

function compareDependencies(): DependencyComparison[] {
  const codessaPath = path.join(__dirname, 'package.json');
  const echoforgePath = path.join(__dirname, '..', 'echoforge', 'package.json');

  const codessaPkg = loadPackageJson(codessaPath);
  const echoforgePkg = loadPackageJson(echoforgePath);

  const allLibraries = new Set<string>();
  
  // Collect all library names
  Object.keys(codessaPkg.dependencies || {}).forEach(lib => allLibraries.add(lib));
  Object.keys(codessaPkg.devDependencies || {}).forEach(lib => allLibraries.add(lib));
  Object.keys(echoforgePkg.dependencies || {}).forEach(lib => allLibraries.add(lib));
  Object.keys(echoforgePkg.devDependencies || {}).forEach(lib => allLibraries.add(lib));

  const comparisons: DependencyComparison[] = [];

  for (const library of Array.from(allLibraries).sort()) {
    const codessaDep = codessaPkg.dependencies?.[library];
    const codessaDevDep = codessaPkg.devDependencies?.[library];
    const echoforgeDep = echoforgePkg.dependencies?.[library];
    const echoforgeDevDep = echoforgePkg.devDependencies?.[library];

    const codessaVersion = codessaDep || codessaDevDep || null;
    const echoforgeVersion = echoforgeDep || echoforgeDevDep || null;

    let type: 'dependency' | 'devDependency' | 'both' = 'dependency';
    if (codessaDevDep || echoforgeDevDep) {
      type = (codessaDep || echoforgeDep) ? 'both' : 'devDependency';
    }

    let status: DependencyComparison['status'];
    if (!codessaVersion && echoforgeVersion) {
      status = 'unique-to-echoforge';
    } else if (codessaVersion && !echoforgeVersion) {
      status = 'unique-to-codessa';
    } else if (codessaVersion === echoforgeVersion) {
      status = 'match';
    } else {
      status = 'version-mismatch';
    }

    comparisons.push({
      library,
      codessaVersion,
      echoforgeVersion,
      type,
      status
    });
  }

  return comparisons;
}

function generateMarkdownReport(comparisons: DependencyComparison[]): string {
  let markdown = `# Dependency Comparison: Codessa vs EchoForge

Generated on: ${new Date().toISOString().split('T')[0]}

## Summary

- **Total Libraries**: ${comparisons.length}
- **Version Mismatches**: ${comparisons.filter(c => c.status === 'version-mismatch').length}
- **Unique to Codessa**: ${comparisons.filter(c => c.status === 'unique-to-codessa').length}
- **Unique to EchoForge**: ${comparisons.filter(c => c.status === 'unique-to-echoforge').length}
- **Matching Versions**: ${comparisons.filter(c => c.status === 'match').length}

## Version Mismatches

| Library | Codessa Version | EchoForge Version | Type |
|---------|-----------------|-------------------|------|
`;

  const mismatches = comparisons.filter(c => c.status === 'version-mismatch');
  for (const comp of mismatches) {
    markdown += `| ${comp.library} | ${comp.codessaVersion || 'N/A'} | ${comp.echoforgeVersion || 'N/A'} | ${comp.type} |\n`;
  }

  markdown += `\n## Libraries Unique to Codessa

| Library | Version | Type |
|---------|---------|------|
`;

  const uniqueToCodessa = comparisons.filter(c => c.status === 'unique-to-codessa');
  for (const comp of uniqueToCodessa) {
    markdown += `| ${comp.library} | ${comp.codessaVersion} | ${comp.type} |\n`;
  }

  markdown += `\n## Libraries Unique to EchoForge

| Library | Version | Type |
|---------|---------|------|
`;

  const uniqueToEchoforge = comparisons.filter(c => c.status === 'unique-to-echoforge');
  for (const comp of uniqueToEchoforge) {
    markdown += `| ${comp.library} | ${comp.echoforgeVersion} | ${comp.type} |\n`;
  }

  markdown += `\n## All Dependencies (Complete List)

| Library | Codessa Version | EchoForge Version | Status | Type |
|---------|-----------------|-------------------|---------|------|
`;

  for (const comp of comparisons) {
    const statusIcon = {
      'match': '✅',
      'version-mismatch': '⚠️',
      'unique-to-codessa': '🔵',
      'unique-to-echoforge': '🟢'
    }[comp.status];
    
    markdown += `| ${comp.library} | ${comp.codessaVersion || 'N/A'} | ${comp.echoforgeVersion || 'N/A'} | ${statusIcon} ${comp.status} | ${comp.type} |\n`;
  }

  return markdown;
}

function main() {
  console.log('🔍 Comparing dependencies between Codessa and EchoForge...');
  
  const comparisons = compareDependencies();
  const markdownReport = generateMarkdownReport(comparisons);
  
  const outputPath = path.join(__dirname, 'dependency-diff.md');
  fs.writeFileSync(outputPath, markdownReport);
  
  console.log(`✅ Dependency comparison complete!`);
  console.log(`📄 Report saved to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`- Total libraries: ${comparisons.length}`);
  console.log(`- Version mismatches: ${comparisons.filter(c => c.status === 'version-mismatch').length}`);
  console.log(`- Unique to Codessa: ${comparisons.filter(c => c.status === 'unique-to-codessa').length}`);
  console.log(`- Unique to EchoForge: ${comparisons.filter(c => c.status === 'unique-to-echoforge').length}`);
}

if (require.main === module) {
  main();
}

export { compareDependencies, generateMarkdownReport, DependencyComparison };

