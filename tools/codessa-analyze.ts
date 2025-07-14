#!/usr/bin/env node

import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import { ArchiveScanner } from './archive-scanner';

interface ProjectManifest {
  project_name: string;
  analysis_timestamp: string;
  metadata: any;
  modules: {
    name: string;
    exports: string[];
    imports: string[];
    functions: string[];
    classes: string[];
  }[];
  potential_agents: string[];
  integration_complexity: 'low' | 'medium' | 'high' | 'epic';
  recommended_guild: string;
  extraction_strategy: string;
}

class CodesssaAnalyzer {
  private scanner: ArchiveScanner;
  private outputPath: string;

  constructor(outputPath: string = './codessa_codex/manifests/') {
    this.scanner = new ArchiveScanner();
    this.outputPath = outputPath;
  }

  async analyzeArchives(archivesPath: string): Promise<void> {
    console.log(`🔍 Analyzing archives in: ${archivesPath}`);
    
    const projects = await this.findProjects(archivesPath);
    
    for (const projectPath of projects) {
      await this.analyzeProject(projectPath);
    }
    
    console.log(`✅ Analysis complete. ${projects.length} projects analyzed.`);
  }

  private async findProjects(archivesPath: string): Promise<string[]> {
    const projects: string[] = [];
    
    try {
      const items = await readdir(archivesPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.')) {
          const projectPath = path.join(archivesPath, item.name);
          projects.push(projectPath);
        }
      }
    } catch (error) {
      console.error(`Error reading archives directory: ${error}`);
    }
    
    return projects;
  }

  private async analyzeProject(projectPath: string): Promise<void> {
    const projectName = path.basename(projectPath);
    console.log(`📊 Analyzing project: ${projectName}`);
    
    try {
      // Get basic archive metadata
      const archiveMetadata = await this.scanner.scanProject(projectPath);
      
      // Load project.meta.json if it exists
      const projectMeta = await this.loadProjectMetadata(projectPath);
      
      // Analyze modules and code structure
      const modules = await this.analyzeModules(projectPath);
      
      // Generate manifest
      const manifest: ProjectManifest = {
        project_name: projectName,
        analysis_timestamp: new Date().toISOString(),
        metadata: {
          ...archiveMetadata,
          ...projectMeta
        },
        modules,
        potential_agents: archiveMetadata.potential_agents,
        integration_complexity: this.assessComplexity(modules, archiveMetadata),
        recommended_guild: archiveMetadata.suggested_guild,
        extraction_strategy: this.determineExtractionStrategy(modules, archiveMetadata)
      };
      
      // Save manifest
      await this.saveManifest(projectName, manifest);
      
      // Create project directory in codex
      await this.createProjectDirectory(projectName, manifest);
      
    } catch (error) {
      console.error(`Error analyzing project ${projectName}: ${error}`);
    }
  }

  private async loadProjectMetadata(projectPath: string): Promise<any> {
    try {
      const metaPath = path.join(projectPath, 'project.meta.json');
      const content = await readFile(metaPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`No project.meta.json found in ${projectPath}`);
      return {};
    }
  }

  private async analyzeModules(projectPath: string): Promise<ProjectManifest['modules']> {
    const modules: ProjectManifest['modules'] = [];
    
    const analyzeFile = async (filePath: string) => {
      const content = await readFile(filePath, 'utf-8');
      const relativePath = path.relative(projectPath, filePath);
      
      // Basic analysis - extract exports, imports, functions, classes
      const exports = this.extractExports(content);
      const imports = this.extractImports(content);
      const functions = this.extractFunctions(content);
      const classes = this.extractClasses(content);
      
      if (exports.length > 0 || functions.length > 0 || classes.length > 0) {
        modules.push({
          name: relativePath,
          exports,
          imports,
          functions,
          classes
        });
      }
    };
    
    const scanDirectory = async (dir: string) => {
      const items = await readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          await scanDirectory(fullPath);
        } else if (item.isFile() && this.isAnalyzableFile(item.name)) {
          try {
            await analyzeFile(fullPath);
          } catch (error) {
            console.warn(`Error analyzing file ${fullPath}: ${error}`);
          }
        }
      }
    };
    
    await scanDirectory(projectPath);
    return modules;
  }

  private isAnalyzableFile(filename: string): boolean {
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs'];
    return extensions.includes(path.extname(filename));
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Match export statements
    const exportRegex = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|interface\s+(\w+)|type\s+(\w+))/g;
    
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportName = match.slice(1).find(Boolean);
      if (exportName) {
        exports.push(exportName);
      }
    }
    
    // Match export { ... } statements
    const namedExportRegex = /export\s*\{\s*([^}]+)\s*\}/g;
    while ((match = namedExportRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
      exports.push(...names);
    }
    
    return [...new Set(exports)];
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    // Match import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return [...new Set(imports)];
  }

  private extractFunctions(content: string): string[] {
    const functions: string[] = [];
    
    // Match function declarations
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*[^=]+=>\s*|function))/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2];
      if (functionName) {
        functions.push(functionName);
      }
    }
    
    return [...new Set(functions)];
  }

  private extractClasses(content: string): string[] {
    const classes: string[] = [];
    
    // Match class declarations
    const classRegex = /class\s+(\w+)/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    return [...new Set(classes)];
  }

  private assessComplexity(modules: ProjectManifest['modules'], metadata: any): 'low' | 'medium' | 'high' | 'epic' {
    const moduleCount = modules.length;
    const totalExports = modules.reduce((sum, mod) => sum + mod.exports.length, 0);
    const totalClasses = modules.reduce((sum, mod) => sum + mod.classes.length, 0);
    const estimatedLoc = metadata.estimated_loc || 0;
    
    let complexity = 0;
    
    if (moduleCount > 20) complexity += 2;
    else if (moduleCount > 10) complexity += 1;
    
    if (totalExports > 50) complexity += 2;
    else if (totalExports > 25) complexity += 1;
    
    if (totalClasses > 20) complexity += 2;
    else if (totalClasses > 10) complexity += 1;
    
    if (estimatedLoc > 10000) complexity += 2;
    else if (estimatedLoc > 5000) complexity += 1;
    
    if (complexity >= 6) return 'epic';
    if (complexity >= 4) return 'high';
    if (complexity >= 2) return 'medium';
    return 'low';
  }

  private determineExtractionStrategy(modules: ProjectManifest['modules'], metadata: any): string {
    const moduleCount = modules.length;
    const hasMainExport = modules.some(mod => mod.exports.includes('default') || mod.exports.includes('main'));
    
    if (moduleCount === 1 && hasMainExport) {
      return 'single_module_extraction';
    }
    
    if (moduleCount <= 5) {
      return 'simple_modular_extraction';
    }
    
    if (metadata.tags?.includes('plugin')) {
      return 'plugin_extraction';
    }
    
    if (metadata.tags?.includes('agent')) {
      return 'agent_extraction';
    }
    
    return 'complex_modular_extraction';
  }

  private async saveManifest(projectName: string, manifest: ProjectManifest): Promise<void> {
    const manifestPath = path.join(this.outputPath, `${projectName}.manifest.json`);
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📄 Manifest saved: ${manifestPath}`);
  }

  private async createProjectDirectory(projectName: string, manifest: ProjectManifest): Promise<void> {
    const projectDir = path.join('./codessa_codex/projects', projectName);
    await mkdir(projectDir, { recursive: true });
    
    // Create integration blueprint template
    const blueprintTemplate = {
      project_name: projectName,
      integration_strategy: manifest.extraction_strategy,
      complexity: manifest.integration_complexity,
      recommended_guild: manifest.recommended_guild,
      potential_agents: manifest.potential_agents,
      refactoring_tasks: [
        'Extract core modules',
        'Implement agent interfaces',
        'Add memory bindings',
        'Create plugin hooks',
        'Add comprehensive tests'
      ],
      integration_points: [
        'Codessa Kernel registration',
        'Agent lifecycle management',
        'Memory system integration',
        'Event system hooks'
      ]
    };
    
    const blueprintPath = path.join(projectDir, 'integration_blueprint.json');
    await writeFile(blueprintPath, JSON.stringify(blueprintTemplate, null, 2));
    
    console.log(`📋 Project directory created: ${projectDir}`);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const archivesPath = args[0] || './archives/raw_potential/';
  const outputPath = args.find(arg => arg.startsWith('--out='))?.split('=')[1] || './codessa_codex/manifests/';
  
  const analyzer = new CodesssaAnalyzer(outputPath);
  analyzer.analyzeArchives(archivesPath).catch(console.error);
}

export { CodesssaAnalyzer };
