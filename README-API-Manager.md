# Codessa API Manager

A secure Google Cloud API manager for the Codessa multi-agent system, featuring Google Secret Manager integration, comprehensive logging, and robust error handling.

## Features

- 🔐 **Secure Secret Management**: Fetch service account credentials from Google Secret Manager
- 🔑 **Automatic Authentication**: Seamless Google Cloud API authentication
- 📊 **Comprehensive Logging**: Winston-based logging with multiple levels and transports
- 🛡️ **Error Handling**: Robust error handling with detailed error responses
- 🧪 **Full Test Coverage**: Unit tests with Jest and TypeScript
- 📦 **TypeScript Support**: Fully typed codebase with interfaces and types

## Directory Structure

```
src/
├── managers/
│   ├── googleSecretManager.ts    # Google Secret Manager service
│   └── apiManager.ts             # Main API Manager
├── types/
│   └── index.ts                  # TypeScript interfaces and types
├── utils/
│   └── logger.ts                 # Winston logger configuration
└── main.ts                       # Main entry point

tests/
├── unit/
│   └── googleSecretManager.test.ts
└── setup.ts                      # Test setup configuration
```

## Prerequisites

1. **Google Cloud Project**: Ensure you have a Google Cloud project set up
2. **Service Account**: Create a service account with appropriate permissions
3. **Secret Manager**: Store your service account key in Google Secret Manager
4. **Node.js**: Version 18 or higher
5. **TypeScript**: For development

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file**:
   ```env
   GCP_PROJECT_ID=your-project-id
   SECRET_NAME=your-secret-name
   LOG_LEVEL=info
   NODE_ENV=development
   ```

## Usage

### Basic Usage

```typescript
import { APIManager } from './src/managers/apiManager';
import { createLogger } from './src/utils/logger';

// Initialize logger
const logger = createLogger({
  level: 'info',
  service: 'codessa-api-manager',
  environment: 'development'
});

// Configure API Manager
const apiManager = new APIManager({
  projectId: 'your-project-id',
  secretName: 'your-secret-name',
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  logLevel: 'info'
});

// Initialize and use
async function main() {
  // Initialize authentication
  await apiManager.initialize();
  
  // Test connection
  const testResult = await apiManager.testConnection();
  console.log('Connection test:', testResult);
  
  // Use the API Manager
  const models = await apiManager.listVertexAIModels();
  console.log('Vertex AI models:', models);
}

main().catch(console.error);
```

### Direct Secret Manager Usage

```typescript
import { GoogleSecretManager } from './src/managers/googleSecretManager';

const secretManager = new GoogleSecretManager();

// Fetch a secret
const result = await secretManager.getSecret({
  projectId: 'your-project-id',
  secretName: 'your-secret-name'
});

if (result.success) {
  console.log('Secret fetched successfully');
  // Use result.data
} else {
  console.error('Failed to fetch secret:', result.error);
}
```

### Custom API Requests

```typescript
// Make custom authenticated API requests
const response = await apiManager.makeRequest({
  method: 'GET',
  url: 'https://your-api-endpoint.com/api/v1/resource',
  headers: {
    'Content-Type': 'application/json'
  }
});

if (response.success) {
  console.log('API response:', response.data);
} else {
  console.error('API error:', response.error);
}
```

## Scripts

- **Run the API Manager**: `npm run api-manager`
- **Build TypeScript**: `npm run build`
- **Run tests**: `npm test`
- **Run tests with coverage**: `npm run test:coverage`
- **Run tests in watch mode**: `npm run test:watch`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GCP_PROJECT_ID` | Google Cloud Project ID | `ava-prime-459710` |
| `SECRET_NAME` | Secret Manager secret name | `codessa-service-account-key` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `NODE_ENV` | Environment (development, production, test) | `development` |
| `GCP_REGION` | Google Cloud region | `us-central1` |

### Logger Configuration

The logger supports multiple levels and transports:

- **Console output**: Colorized for development
- **File output**: JSON format for production
- **Error file**: Separate file for errors only

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- **Unit tests**: Located in `tests/unit/`
- **Test setup**: `tests/setup.ts` configures the test environment
- **Mocking**: Google Cloud services are mocked for testing

## Security Considerations

1. **Never store secrets in code**: Always use Google Secret Manager
2. **Use appropriate IAM roles**: Grant minimal necessary permissions
3. **Rotate secrets regularly**: Update service account keys periodically
4. **Monitor access**: Use Cloud Logging to monitor secret access
5. **Environment separation**: Use different secrets for different environments

## Error Handling

The API Manager provides comprehensive error handling:

```typescript
const result = await apiManager.listVertexAIModels();

if (!result.success) {
  console.error('Error details:', {
    error: result.error,
    statusCode: result.statusCode
  });
  
  // Handle specific error types
  if (result.statusCode === 403) {
    console.error('Permission denied - check IAM roles');
  }
}
```

## Logging

All operations are logged with appropriate levels:

```typescript
// Different log levels
logger.error('Critical error message', { context: 'data' });
logger.warn('Warning message', { context: 'data' });
logger.info('Info message', { context: 'data' });
logger.debug('Debug message', { context: 'data' });
```

## Contributing

1. **Follow TypeScript conventions**: Use proper types and interfaces
2. **Add tests**: All new features should include unit tests
3. **Update documentation**: Keep README and code comments current
4. **Use proper logging**: Log important operations and errors
5. **Handle errors gracefully**: Always return proper error responses

## Troubleshooting

### Common Issues

1. **Permission denied errors**:
   - Check IAM roles for the service account
   - Ensure Secret Manager API is enabled
   - Verify project ID is correct

2. **Secret not found**:
   - Verify secret name in Secret Manager
   - Check if secret exists in the correct project
   - Ensure proper version is specified

3. **Authentication failures**:
   - Validate service account key format
   - Check if service account is enabled
   - Verify required APIs are enabled

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
LOG_LEVEL=debug npm run api-manager
```

This will provide detailed logs for all operations, including API requests and responses.

## License

MIT License - see LICENSE file for details.
