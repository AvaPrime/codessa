import { createLogger } from '../src/utils/logger';

// Initialize logger for tests
beforeAll(() => {
  createLogger({
    level: 'error', // Reduce noise during tests
    service: 'codessa-api-manager-test',
    environment: 'test'
  });
});

// Mock environment variables
process.env.GCP_PROJECT_ID = 'test-project';
process.env.SECRET_NAME = 'test-secret';
process.env.LOG_LEVEL = 'error';
process.env.NODE_ENV = 'test';
