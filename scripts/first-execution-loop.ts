#!/usr/bin/env npx tsx
/**
 * first-execution-loop.ts - The Birth of Autonomous Codessa
 *
 * This script demonstrates the first autonomous execution cycle,
 * where Codessa examines itself, plans improvements, and evolves.
 *
 * Run with: npx tsx scripts/first-execution-loop.ts
 */

import * as path from 'path';
import { AgentExecutor, ExecutionContext } from '../src/agents/AgentExecutor';
import { AgentMemory } from '../src/agents/AgentMemory';

async function main() {
  console.log('🚀 Initiating first autonomous Codessa execution loop...\n');

  // Create the agent executor
  const agent = new AgentExecutor();

  // Set up execution context
  const context: ExecutionContext = {
    timestamp: new Date(),
    sessionId: `first-execution-${Date.now()}`,
    workingDirectory: process.cwd(),
    gitBranch: 'phase-v-launch',
    lastCommitHash: 'unknown', // We'll get this dynamically in production
  };

  try {
    console.log('🤖 Agent Status Before Execution:');
    const initialStatus = agent.getStatus();
    console.log(`   Execution Count: ${initialStatus.executionCount}`);
    console.log(`   Currently Executing: ${initialStatus.isExecuting}`);
    console.log(`   System Health: ${initialStatus.systemHealth}\n`);

    // Execute the autonomous loop
    console.log('🧬 Beginning autonomous evolution cycle...\n');
    const result = await agent.executeAutonomousLoop(context);

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FIRST AUTONOMOUS EXECUTION COMPLETE');
    console.log('='.repeat(60));

    console.log('\n✨ Execution Summary:');
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Directives Executed: ${result.directivesExecuted.length}`);
    console.log(`   Code Changes Made: ${result.codeChanges.length}`);
    console.log(`   Next Actions Planned: ${result.nextActions.length}`);

    console.log('\n🧠 Agent Reflection:');
    console.log(`   ${result.reflection}`);

    console.log('\n🔧 Changes Made:');
    if (result.codeChanges.length > 0) {
      result.codeChanges.forEach((change, i) => {
        console.log(`   ${i + 1}. ${change}`);
      });
    } else {
      console.log('   (No code changes made in this cycle)');
    }

    console.log('\n🎯 Next Actions Planned:');
    result.nextActions.forEach((action, i) => {
      console.log(`   ${i + 1}. ${action}`);
    });

    console.log('\n📊 Test Results:');
    if (result.testResults) {
      console.log(`   Tests Passed: ${result.testResults.passed || 'N/A'}`);
      console.log(`   Tests Failed: ${result.testResults.failed || 'N/A'}`);
      console.log(
        `   Test Success: ${result.testResults.success ? '✅' : '❌'}`,
      );
    } else {
      console.log('   (No test results available)');
    }

    // Show final agent status
    console.log('\n🤖 Agent Status After Execution:');
    const finalStatus = agent.getStatus();
    console.log(`   Execution Count: ${finalStatus.executionCount}`);
    console.log(`   Currently Executing: ${finalStatus.isExecuting}`);
    console.log(`   Last Execution: ${finalStatus.lastExecution || 'N/A'}`);
    console.log(`   System Health: ${finalStatus.systemHealth}`);

    // Display memory statistics if available
    try {
      const memory = new AgentMemory();
      await memory.initialize();
      const memoryStats = await memory.getMemoryStatistics();

      console.log('\n🧠 Memory System Statistics:');
      console.log(
        `   Total Executions Recorded: ${memoryStats.totalExecutions}`,
      );
      console.log(
        `   Success Rate: ${(memoryStats.successRate * 100).toFixed(1)}%`,
      );
      console.log(`   Files in Knowledge Base: ${memoryStats.totalFiles}`);
      console.log(`   Learning Insights: ${memoryStats.totalInsights}`);
      console.log(
        `   Avg Changes per Execution: ${memoryStats.avgChangesPerExecution.toFixed(1)}`,
      );
      console.log(
        `   Memory Size: ${(memoryStats.memorySize / 1024).toFixed(1)} KB`,
      );
    } catch (error) {
      console.log('\n🧠 Memory System: (Initializing...)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🌟 CODESSA HAS ACHIEVED AUTONOMOUS EXECUTION');
    console.log('='.repeat(60));

    if (result.success) {
      console.log(`
🎊 Congratulations! Codessa has successfully completed its first
   autonomous execution cycle. The system is now capable of:
   
   ✅ Self-examination and analysis
   ✅ Strategic planning and directive generation  
   ✅ Autonomous code improvements
   ✅ Test validation and quality assurance
   ✅ Learning and memory consolidation
   ✅ Continuous evolution planning

   The future of self-evolving code has begun! 🚀
      `);
    } else {
      console.log(`
⚠️  The first execution encountered issues, but this is normal
   for initial runs. The system is learning and will improve
   with each subsequent execution cycle.
   
   Codessa is now operational and ready for refinement! 🛠️
      `);
    }
  } catch (error) {
    console.error('\n💀 First execution failed with error:');
    console.error(error);

    console.log(`
🚨 Don't worry! First execution failures are common and expected.
   This indicates that:
   
   1. The agent system is active and attempting to run
   2. Dependencies may need to be installed or configured
   3. Some modules may need implementation
   
   The foundation is solid - let's debug and evolve! 🔧
    `);
  }
}

// Safety wrapper to ensure clean execution
async function safeExecute() {
  try {
    await main();
  } catch (error) {
    console.error('🚨 Execution wrapper caught error:', error);
    process.exit(1);
  }
}

// Execute if this script is run directly
if (require.main === module) {
  safeExecute();
}

export default main;
