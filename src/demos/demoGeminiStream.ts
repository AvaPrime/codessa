#!/usr/bin/env ts-node
// src/demos/demoGeminiStream.ts

import { GeminiPromptAgent } from '../agents/geminiPromptAgent';

async function demoGeminiStreaming() {
  console.log('🧠 Codessa Gemini Streaming Demo');
  console.log('================================\n');

  // Initialize the agent
  const agent = new GeminiPromptAgent({
    projectId: 'codessa-core' // Replace with your project ID
  });

  // Test streaming with a simple prompt
  const prompt = 'Write a short story about a robot learning to paint. Make it about 200 words.';
  
  console.log(`📝 Prompt: ${prompt}\n`);
  console.log('🌊 Streaming Response:');
  console.log('---');

  let fullResponse = '';
  
  try {
    await agent.generatePromptStream(
      prompt,
      (chunk: string) => {
        // This callback is called for each chunk
        process.stdout.write(chunk);
        fullResponse += chunk;
      }
    );
    
    console.log('\n---');
    console.log('✅ Stream completed');
    console.log(`📊 Total characters: ${fullResponse.length}`);
    
  } catch (error) {
    console.error('❌ Error during streaming:', error);
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  demoGeminiStreaming().catch(console.error);
}

export { demoGeminiStreaming };
