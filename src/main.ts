import dotenv from 'dotenv';
import { APIManager } from './managers/apiManager';
import { createLogger } from './utils/logger';
import { APIManagerConfig } from './types';

// Load environment variables
dotenv.config();

async function main() {
  // Initialize logger
  const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    service: 'codessa-api-manager',
    environment: process.env.NODE_ENV || 'development'
  });

  logger.info('Starting Codessa API Manager');

  // Configuration
  const config: APIManagerConfig = {
    projectId: process.env.GCP_PROJECT_ID || 'codessa-core',
    secretName: process.env.SECRET_NAME || 'codessa-service-account-key',
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/storage.read_only'
    ],
    logLevel: (process.env.LOG_LEVEL as any) || 'info'
  };

  logger.info('Configuration loaded', {
    projectId: config.projectId,
    secretName: config.secretName,
    scopes: config.scopes
  });

  try {
    // Initialize API Manager
    const apiManager = new APIManager(config);
    
    // Initialize authentication
    const initResult = await apiManager.initialize();
    if (!initResult.success) {
      logger.error('Failed to initialize API Manager', { error: initResult.error });
      process.exit(1);
    }

    logger.info('API Manager initialized successfully');

    // Skip connection test and go directly to API calls
    logger.info('Skipping connection test, proceeding to API calls...');

    // Example: List Vertex AI models
    logger.info('Fetching Vertex AI models...');
    const vertexResult = await apiManager.listVertexAIModels();
    if (vertexResult.success) {
      logger.info('Vertex AI models fetched successfully', {
        modelCount: vertexResult.data?.models?.length || 0
      });
    } else {
      logger.warn('Failed to fetch Vertex AI models', { error: vertexResult.error });
    }

    // Example: List Cloud Storage buckets
    logger.info('Fetching Cloud Storage buckets...');
    const storageResult = await apiManager.listStorageBuckets();
    if (storageResult.success) {
      logger.info('Cloud Storage buckets fetched successfully', {
        bucketCount: storageResult.data?.items?.length || 0
      });
    } else {
      logger.warn('Failed to fetch Cloud Storage buckets', { error: storageResult.error });
    }

    logger.info('Codessa API Manager execution completed successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Unexpected error in main execution', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
