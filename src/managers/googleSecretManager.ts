import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { SecretConfig, SecretManagerResponse, GoogleCredentials } from '../types';
import { getLogger } from '../utils/logger';

export class GoogleSecretManager {
  private client: SecretManagerServiceClient;
  private logger = getLogger();

  constructor() {
    this.client = new SecretManagerServiceClient();
    this.logger.info('GoogleSecretManager initialized');
  }

  /**
   * Fetch a secret from Google Secret Manager
   */
  async getSecret(config: SecretConfig): Promise<SecretManagerResponse> {
    const { projectId, secretName, version = 'latest' } = config;
    const secretPath = `projects/${projectId}/secrets/${secretName}/versions/${version}`;

    try {
      this.logger.info('Fetching secret from Secret Manager', {
        projectId,
        secretName,
        version,
        secretPath
      });

      const [response] = await this.client.accessSecretVersion({
        name: secretPath
      });

      const payload = response.payload?.data?.toString('utf8');
      
      if (!payload) {
        const error = 'Secret payload is empty or undefined';
        this.logger.error(error, { secretPath });
        return { success: false, error };
      }

      this.logger.info('Secret fetched successfully', {
        secretPath,
        payloadLength: payload.length
      });

      return { success: true, data: payload };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to fetch secret from Secret Manager', {
        secretPath,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Fetch and parse service account credentials
   */
  async getServiceAccountCredentials(config: SecretConfig): Promise<SecretManagerResponse> {
    try {
      const secretResponse = await this.getSecret(config);
      
      if (!secretResponse.success || !secretResponse.data) {
        return secretResponse;
      }

      // Validate that the secret contains valid JSON credentials
      const credentials: GoogleCredentials = JSON.parse(secretResponse.data);
      
      // Basic validation of required fields
      const requiredFields: (keyof GoogleCredentials)[] = [
        'type', 'project_id', 'private_key', 'client_email'
      ];
      
      for (const field of requiredFields) {
        if (!credentials[field]) {
          const error = `Missing required field in service account credentials: ${field}`;
          this.logger.error(error, { secretPath: config.secretName });
          return { success: false, error };
        }
      }

      this.logger.info('Service account credentials validated successfully', {
        projectId: credentials.project_id,
        clientEmail: credentials.client_email
      });

      return { success: true, data: secretResponse.data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to parse service account credentials', {
        secretName: config.secretName,
        error: errorMessage
      });

      return { success: false, error: `Invalid JSON in service account credentials: ${errorMessage}` };
    }
  }

  /**
   * Test connection to Secret Manager
   */
  async testConnection(projectId: string): Promise<SecretManagerResponse> {
    try {
      this.logger.info('Testing Secret Manager connection', { projectId });

      const [secrets] = await this.client.listSecrets({
        parent: `projects/${projectId}`,
        pageSize: 1
      });

      this.logger.info('Secret Manager connection test successful', {
        projectId,
        secretCount: secrets.length
      });

      return { success: true, data: 'Connection successful' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Secret Manager connection test failed', {
        projectId,
        error: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }
}
