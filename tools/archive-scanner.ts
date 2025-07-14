import { readdir, stat, readFile, writeFile } from 'fs/promises';
import path from 'path';

interface ArchiveMetadata {
  project_name: string;
  original_purpose: string;
  technologies: string[];
  primary_language: string;
  estimated_loc: number;
  key_capabilities: string[];
  integration_priority: 'low' | 'medium' | 'high' | 'critical';
  potential_agents: string[];
  suggested_guild: string;
  archival_date: string;
  source_location: string;
  notes: string;
}

interface IntakeManifest {
  archive_version: string;
  last_updated: string;
  total_projects: number;
  projects: Array<{
    name: string;
    status: 'pending' | 'processing' | 'analyzed' | 'integrated';
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimated_complexity: 'simple' | 'moderate' | 'complex' | 'epic';
  }>;
  processing_queue: string[];
  integration_roadmap: {
    phase_1: string[];
    phase_2: string[];
    phase_3: string[];
  };
}

class ArchiveScanner {
  private readonly manifestPath: string;
  private readonly archivesPath: string;

  constructor(archivesPath: string = './archives') {
    this.archivesPath = archivesPath;
    this.manifestPath = path.join(archivesPath, 'raw_potential', 'intake_manifest.json');
  }

  async scanProject(projectPath: string): Promise<ArchiveMetadata> {
    const projectName = path.basename(projectPath);
    
    // Analyze file structure
    const fileStats = await this.analyzeFileStructure(projectPath);
    
    // Detect technologies and frameworks
    const technologies = await this.detectTechnologies(projectPath);
    
    // Estimate lines of code
    const estimatedLoc = await this.estimateLines(projectPath);
    
    // Determine primary language
    const primaryLanguage = this.determinePrimaryLanguage(fileStats);
    
    // Extract capabilities from README or package.json
    const capabilities = await this.extractCapabilities(projectPath);
    
    // Suggest agent archetypes and guilds
    const { agents, guild } = this.suggestAgentBindings(technologies, capabilities);
    
    // Determine integration priority
    const priority = this.determinePriority(technologies, capabilities, estimatedLoc);

    return {
      project_name: projectName,
      original_purpose: await this.extractPurpose(projectPath),
      technologies,
      primary_language: primaryLanguage,
      estimated_loc: estimatedLoc,
      key_capabilities: capabilities,
      integration_priority: priority,
      potential_agents: agents,
      suggested_guild: guild,
      archival_date: new Date().toISOString(),
      source_location: projectPath,
      notes: `Automatically scanned on ${new Date().toISOString()}`
    };
  }

  private async analyzeFileStructure(projectPath: string): Promise<Map<string, number>> {
    const fileStats = new Map<string, number>();
    
    const scanDirectory = async (dir: string) => {
      try {
        const files = await readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await stat(filePath);
          
          if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            await scanDirectory(filePath);
          } else if (stats.isFile()) {
            const ext = path.extname(file).toLowerCase();
            fileStats.set(ext, (fileStats.get(ext) || 0) + 1);
          }
        }
      } catch (error) {
        console.warn(`Error scanning ${dir}:`, error);
      }
    };
    
    await scanDirectory(projectPath);
    return fileStats;
  }

  private async detectTechnologies(projectPath: string): Promise<string[]> {
    const technologies: string[] = [];
    
    try {
      // Check package.json for Node.js/npm dependencies
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      if (packageJson.dependencies || packageJson.devDependencies) {
        technologies.push('Node.js');
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react) technologies.push('React');
        if (deps.typescript) technologies.push('TypeScript');
        if (deps.firebase) technologies.push('Firebase');
        if (deps.chromadb) technologies.push('ChromaDB');
        if (deps.express) technologies.push('Express');
        if (deps.next) technologies.push('Next.js');
      }
    } catch (error) {
      // No package.json found
    }
    
    // Check for other technology indicators
    const files = await readdir(projectPath).catch(() => []);
    if (files.includes('requirements.txt')) technologies.push('Python');
    if (files.includes('Cargo.toml')) technologies.push('Rust');
    if (files.includes('go.mod')) technologies.push('Go');
    if (files.includes('pom.xml')) technologies.push('Java');
    
    return technologies;
  }

  private async estimateLines(projectPath: string): Promise<number> {
    let totalLines = 0;
    const codeExtensions = ['.ts', '.js', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h'];
    
    const countLines = async (dir: string) => {
      try {
        const files = await readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await stat(filePath);
          
          if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            await countLines(filePath);
          } else if (stats.isFile() && codeExtensions.includes(path.extname(file).toLowerCase())) {
            const content = await readFile(filePath, 'utf-8');
            totalLines += content.split('\n').length;
          }
        }
      } catch (error) {
        console.warn(`Error counting lines in ${dir}:`, error);
      }
    };
    
    await countLines(projectPath);
    return totalLines;
  }

  private determinePrimaryLanguage(fileStats: Map<string, number>): string {
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.h': 'C/C++'
    };
    
    let maxCount = 0;
    let primaryLanguage = 'Unknown';
    
    for (const [ext, count] of fileStats) {
      if (languageMap[ext] && count > maxCount) {
        maxCount = count;
        primaryLanguage = languageMap[ext];
      }
    }
    
    return primaryLanguage;
  }

  private async extractCapabilities(projectPath: string): Promise<string[]> {
    const capabilities: string[] = [];
    
    try {
      // Check README for capabilities
      const readmeFiles = ['README.md', 'README.txt', 'readme.md'];
      for (const readmeFile of readmeFiles) {
        try {
          const readmePath = path.join(projectPath, readmeFile);
          const content = await readFile(readmePath, 'utf-8');
          
          // Look for common capability keywords
          const keywords = [
            'api', 'database', 'authentication', 'cli', 'web', 'mobile',
            'ai', 'ml', 'analysis', 'processing', 'chat', 'bot', 'agent',
            'memory', 'semantic', 'search', 'vector', 'embedding'
          ];
          
          const lowercaseContent = content.toLowerCase();
          keywords.forEach(keyword => {
            if (lowercaseContent.includes(keyword)) {
              capabilities.push(keyword);
            }
          });
          
          break;
        } catch (error) {
          // Continue to next README file
        }
      }
    } catch (error) {
      console.warn('Error extracting capabilities:', error);
    }
    
    return [...new Set(capabilities)]; // Remove duplicates
  }

  private async extractPurpose(projectPath: string): Promise<string> {
    try {
      const readmeFiles = ['README.md', 'README.txt', 'readme.md'];
      for (const readmeFile of readmeFiles) {
        try {
          const readmePath = path.join(projectPath, readmeFile);
          const content = await readFile(readmePath, 'utf-8');
          
          // Extract first paragraph as purpose
          const lines = content.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.length > 20) {
              return trimmed.substring(0, 200) + (trimmed.length > 200 ? '...' : '');
            }
          }
        } catch (error) {
          // Continue to next README file
        }
      }
    } catch (error) {
      console.warn('Error extracting purpose:', error);
    }
    
    return 'Purpose not determined from available documentation';
  }

  private suggestAgentBindings(technologies: string[], capabilities: string[]): { agents: string[], guild: string } {
    const agents: string[] = [];
    let guild = 'Guild of Reason'; // Default guild
    
    // Suggest agents based on capabilities
    if (capabilities.includes('ai') || capabilities.includes('ml')) {
      agents.push('Oracle', 'Seeker');
      guild = 'Guild of Reason';
    }
    
    if (capabilities.includes('database') || capabilities.includes('memory')) {
      agents.push('Guardian', 'Archivist');
      guild = 'Order of Memory';
    }
    
    if (capabilities.includes('cli') || capabilities.includes('api')) {
      agents.push('Executor', 'Weaver');
      guild = 'Circle of Executors';
    }
    
    if (capabilities.includes('web') || capabilities.includes('ui')) {
      agents.push('Weaver', 'Scribe');
      guild = 'Weavers of Code';
    }
    
    if (capabilities.includes('chat') || capabilities.includes('bot')) {
      agents.push('Oracle', 'Sovereign');
      guild = 'Guild of Reason';
    }
    
    // Default agents if none identified
    if (agents.length === 0) {
      agents.push('Seeker', 'Weaver');
    }
    
    return { agents, guild };
  }

  private determinePriority(technologies: string[], capabilities: string[], estimatedLoc: number): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0;
    
    // Technology relevance
    if (technologies.includes('TypeScript')) score += 2;
    if (technologies.includes('React')) score += 2;
    if (technologies.includes('Firebase')) score += 2;
    if (technologies.includes('ChromaDB')) score += 3;
    if (technologies.includes('Node.js')) score += 1;
    
    // Capability importance
    if (capabilities.includes('ai')) score += 3;
    if (capabilities.includes('agent')) score += 3;
    if (capabilities.includes('memory')) score += 2;
    if (capabilities.includes('cli')) score += 2;
    if (capabilities.includes('api')) score += 1;
    
    // Project size consideration
    if (estimatedLoc > 5000) score += 2;
    else if (estimatedLoc > 1000) score += 1;
    
    if (score >= 8) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  async updateIntakeManifest(projectMetadata: ArchiveMetadata): Promise<void> {
    try {
      const manifestContent = await readFile(this.manifestPath, 'utf-8');
      const manifest: IntakeManifest = JSON.parse(manifestContent);
      
      // Add project to manifest
      manifest.projects.push({
        name: projectMetadata.project_name,
        status: 'pending',
        priority: projectMetadata.integration_priority,
        estimated_complexity: this.estimateComplexity(projectMetadata.estimated_loc)
      });
      
      // Add to processing queue
      manifest.processing_queue.push(projectMetadata.project_name);
      
      // Update roadmap based on priority
      switch (projectMetadata.integration_priority) {
        case 'critical':
          manifest.integration_roadmap.phase_1.push(projectMetadata.project_name);
          break;
        case 'high':
          manifest.integration_roadmap.phase_2.push(projectMetadata.project_name);
          break;
        default:
          manifest.integration_roadmap.phase_3.push(projectMetadata.project_name);
      }
      
      manifest.total_projects = manifest.projects.length;
      manifest.last_updated = new Date().toISOString();
      
      await writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
    } catch (error) {
      console.error('Error updating intake manifest:', error);
    }
  }

  private estimateComplexity(loc: number): 'simple' | 'moderate' | 'complex' | 'epic' {
    if (loc < 500) return 'simple';
    if (loc < 2000) return 'moderate';
    if (loc < 10000) return 'complex';
    return 'epic';
  }

  async scanAndArchive(projectPath: string): Promise<void> {
    console.log(`Scanning project: ${projectPath}`);
    
    const metadata = await this.scanProject(projectPath);
    
    // Create metadata file in the project directory
    const metadataPath = path.join(projectPath, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Update intake manifest
    await this.updateIntakeManifest(metadata);
    
    console.log(`Project archived: ${metadata.project_name}`);
    console.log(`Priority: ${metadata.integration_priority}`);
    console.log(`Suggested Guild: ${metadata.suggested_guild}`);
    console.log(`Potential Agents: ${metadata.potential_agents.join(', ')}`);
  }
}

// CLI usage
if (require.main === module) {
  const scanner = new ArchiveScanner();
  const projectPath = process.argv[2];
  
  if (!projectPath) {
    console.error('Usage: node archive-scanner.js <project-path>');
    process.exit(1);
  }
  
  scanner.scanAndArchive(projectPath).catch(console.error);
}

export { ArchiveScanner, ArchiveMetadata, IntakeManifest };
