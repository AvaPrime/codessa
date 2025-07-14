import { SemanticAnalyzer } from './core/semantic-analyzer';
import { AgentBinder } from './agents/agent-binder';
import { ModuleExtractor } from './integration/module-extractor';
import { ArchiveScanner } from '../archive-scanner';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

class CodesssaInquisitor {
  private semanticAnalyzer: SemanticAnalyzer;
  private agentBinder: AgentBinder;
  private moduleExtractor: ModuleExtractor;
  private archiveScanner: ArchiveScanner;

  constructor() {
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.agentBinder = new AgentBinder();
    this.moduleExtractor = new ModuleExtractor();
    this.archiveScanner = new ArchiveScanner();
  }

  async analyzeProject(projectPath: string): Promise<void> {
    console.log(`🔍 Codessa Inquisitor analyzing: ${projectPath}`);
    
    // Step 1: Basic archive scanning
    const archiveMetadata = await this.archiveScanner.scanProject(projectPath);
    console.log(`📊 Archive metadata generated`);
    
    // Step 2: Deep semantic analysis
    const semanticAnalysis = await this.semanticAnalyzer.analyzeProject(projectPath);
    console.log(`🧠 Semantic analysis complete`);
    
    // Step 3: Agent binding analysis
    const agentRecommendations = await this.agentBinder.analyzeAgentBindings(
      semanticAnalysis,
      archiveMetadata.key_capabilities
    );
    console.log(`🤖 Agent binding recommendations generated`);
    
    // Step 4: Integration blueprint
    const integrationBlueprint = await this.moduleExtractor.generateBlueprint(
      projectPath,
      semanticAnalysis,
      agentRecommendations
    );
    console.log(`🗺️ Integration blueprint created`);
    
    // Step 5: Generate comprehensive report
    const analysisReport = {
      project_name: archiveMetadata.project_name,
      analysis_timestamp: new Date().toISOString(),
      analysis_version: '1.0.0',
      semantic_analysis: semanticAnalysis,
      agent_recommendations: agentRecommendations,
      integration_blueprint: integrationBlueprint,
      archive_metadata: archiveMetadata
    };
    
    // Save report
    await this.saveAnalysisReport(projectPath, analysisReport);
    
    console.log(`✅ Analysis complete for ${archiveMetadata.project_name}`);
  }

  private async saveAnalysisReport(projectPath: string, report: any): Promise<void> {
    const reportPath = path.join(
      './codessa_codex/manifests',
      path.basename(projectPath),
      'analysis_report.json'
    );
    
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2));
  }
}

// CLI Usage
if (require.main === module) {
  const inquisitor = new CodesssaInquisitor();
  const projectPath = process.argv[2];
  
  if (!projectPath) {
    console.error('Usage: node codessa-inquisitor.js <project-path>');
    process.exit(1);
  }
  
  inquisitor.analyzeProject(projectPath).catch(console.error);
}

export { CodesssaInquisitor };
