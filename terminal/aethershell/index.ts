#!/usr/bin/env node

import { CodesssaKernel } from 'codessa-core';
import { AetherShellEventHandler } from './event-handler';
import { aethershellCLI } from './aethershell';
import chalk from 'chalk';

class AetherShell {
  private kernel: CodesssaKernel;
  private eventHandler: AetherShellEventHandler;

  constructor() {
    this.kernel = new CodesssaKernel();
    this.eventHandler = new AetherShellEventHandler(this.kernel);
  }

  async initialize(): Promise<void> {
    try {
      console.log(chalk.bold.blue('🌟 Initializing AetherShell...'));
      
      // Initialize Codessa Kernel
      await this.kernel.initialize();
      
      // Start event listening
      this.eventHandler.startListening();
      
      // Display welcome message
      this.displayWelcome();
      
      console.log(chalk.bold.green('✅ AetherShell ready'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize AetherShell:'), error.message);
      process.exit(1);
    }
  }

  private displayWelcome(): void {
    console.log(chalk.bold.cyan(`
╭─────────────────────────────────────────╮
│            🌌 AetherShell 1.0           │
│        The Voice of Codessa OS          │
╰─────────────────────────────────────────╯

Available Commands:
  ${chalk.yellow('codessa list-agents')}     - List all active agents
  ${chalk.yellow('codessa run-directive')}   - Execute a directive
  ${chalk.yellow('codessa query-memory')}    - Query memory system
  ${chalk.yellow('codessa agent-status')}    - Check agent status

Quick aliases:
  ${chalk.cyan('cs')} - Status    ${chalk.cyan('cd')} - Directive    ${chalk.cyan('cm')} - Memory    ${chalk.cyan('ca')} - Agent

Type 'codessa --help' for full command reference.
    `));
  }

  async shutdown(): Promise<void> {
    console.log(chalk.yellow('🔄 Shutting down AetherShell...'));
    this.eventHandler.stopListening();
    await this.kernel.shutdown();
    console.log(chalk.bold.red('🔴 AetherShell terminated'));
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  const shell = new AetherShell();
  await shell.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const shell = new AetherShell();
  await shell.shutdown();
  process.exit(0);
});

// Main execution
async function main() {
  const shell = new AetherShell();
  await shell.initialize();
  
  // Parse CLI arguments
  aethershellCLI.parse();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  });
}

export { AetherShell };
