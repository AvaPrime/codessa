import { CodesssaKernel } from 'codessa-core';
import chalk from 'chalk';

class AetherShellEventHandler {
  private kernel: CodesssaKernel;

  constructor(kernel: CodesssaKernel) {
    this.kernel = kernel;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Directive events
    this.kernel.on('directive.started', (directive) => {
      console.log(chalk.blue(`🚀 Directive started: ${directive.name}`));
    });

    this.kernel.on('directive.completed', (directive) => {
      console.log(chalk.green(`✅ Directive completed: ${directive.name}`));
    });

    this.kernel.on('directive.failed', (directive, error) => {
      console.log(chalk.red(`❌ Directive failed: ${directive.name} - ${error.message}`));
    });

    // Agent events
    this.kernel.on('agent.registered', (agent) => {
      console.log(chalk.cyan(`🤖 Agent registered: ${agent.name} (${agent.guild})`));
    });

    this.kernel.on('agent.stateChange', (agent) => {
      console.log(chalk.yellow(`🔄 Agent state changed: ${agent.name} -> ${agent.state}`));
    });

    this.kernel.on('agent.error', (agent, error) => {
      console.log(chalk.red(`⚠️ Agent error: ${agent.name} - ${error.message}`));
    });

    // Memory events
    this.kernel.on('memory.stored', (data) => {
      console.log(chalk.magenta(`💾 Memory stored: ${data.type}`));
    });

    this.kernel.on('memory.queried', (query, results) => {
      console.log(chalk.blue(`🔍 Memory query: "${query}" returned ${results.length} results`));
    });

    // System events
    this.kernel.on('system.ready', () => {
      console.log(chalk.bold.green('🌟 Codessa OS ready'));
    });

    this.kernel.on('system.shutdown', () => {
      console.log(chalk.bold.red('🔴 Codessa OS shutting down'));
    });
  }

  public startListening(): void {
    console.log(chalk.bold.cyan('🎧 AetherShell event listener started'));
  }

  public stopListening(): void {
    this.kernel.removeAllListeners();
    console.log(chalk.bold.yellow('🔇 AetherShell event listener stopped'));
  }
}

export { AetherShellEventHandler };
