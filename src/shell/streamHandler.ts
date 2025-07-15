// src/shell/streamHandler.ts

import { Logger } from '../utils/logger';

const logger = new Logger('StreamHandler');

export function handleStream(stream: AsyncIterable<any>, onChunk: (chunk: string) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      for await (const chunk of stream) {
        const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunkText) {
          logger.debug(`Received chunk: ${chunkText}`);
          onChunk(chunkText);
        }
      }
      resolve();
    } catch (error) {
      logger.error('Error in stream handling', error);
      reject(error);
    }
  });
}

export async function displayStreamingResponse(stream: AsyncIterable<any>): Promise<void> {
  process.stdout.write('\n🔄 Streaming response:');
  console.log('\n' + '─'.repeat(50));

  await handleStream(stream, (chunk: string) => {
    process.stdout.write(chunk);
  });

  console.log('\n' + '─'.repeat(50));
}


