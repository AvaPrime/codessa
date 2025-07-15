#!/usr/bin/env ts-node
// src/cli/promptCli.ts

import { CentralOrchestrator } from '../orchestration/centralOrchestrator';
import { GeminiPromptAgent } from '../agents/geminiPromptAgent';
import { Logger } from '../utils/logger';

const logger = new Logger('PromptCLI');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run prompt "Your prompt here"');
    console.log('       npm run prompt "Your prompt here" --thread-id=thread_123');
    console.log('       npm run prompt "Your prompt here" --new-thread');
    process.exit(1);
  }

  const prompt = args[0];
  const threadId = args.find(arg => arg.startsWith('--thread-id='))?.split('=')[1];
  const newThread = args.includes('--new-thread');

  console.log('🧠 Codessa Prompt CLI');
  console.log('=====================\n');

  try {
    // Initialize orchestrator
    const orchestrator = new CentralOrchestrator();
    
    // Initialize and register Gemini agent
    const geminiAgent = new GeminiPromptAgent({
      projectId: 'codessa-core'
    });
    
    await orchestrator.registerAgent(
      'gemini',
      geminiAgent,
      {
        name: 'Gemini LLM Agent',
        description: 'Google Gemini-powered conversation agent with threading',
        version: '1.0.0'
      },
      async () => await geminiAgent.testConnection()
    );

    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🧵 Thread: ${threadId || 'auto-create'}`);
    console.log(`🆕 New Thread: ${newThread ? 'yes' : 'no'}\n`);

    console.log('💭 Processing...\n');

    // Process the prompt
    const response = await orchestrator.processPromptRequest(prompt, {
      threadId,
      newThread
    });

    console.log('🤖 Response:');
    console.log('---');
    console.log(response);
    console.log('---');

    console.log('\n✅ Prompt processed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the CLI if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
