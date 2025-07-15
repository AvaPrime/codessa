import { GoogleAuth } from 'google-auth-library';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { GoogleSecretManager } from './googleSecretManager';
import { APIManagerConfig, APIResponse, GoogleCredentials } from '../types';
import { getLogger } from '../utils/logger';

export class APIManager {
  private secretManager: GoogleSecretManager;
  private auth: GoogleAuth | null = null;
  private authenticatedClient: AxiosInstance | null = null;
  private config: APIManagerConfig;
  private logger = getLogger();

  constructor(config: APIManagerConfig) {
    this.config = config;
    this.secretManager = new GoogleSecretManager();
    this.logger.info('APIManager initialized', { 
      projectId: config.projectId,
      secretName: config.secretName,
      scopes: config.scopes
    });
  }

  /**
   * Initialize authentication using service account from Secret Manager
   */
  async initialize(): Promise<APIResponse<void>> {
    try {
      this.logger.info('Initializing API Manager authentication');

      // Fetch service account credentials from Secret Manager
      const credentialsResponse = await this.secretManager.getServiceAccountCredentials({
        projectId: this.config.projectId,
        secretName: this.config.secretName
      });

      if (!credentialsResponse.success || !credentialsResponse.data) {
        return {
          success: false,
          error: credentialsResponse.error || 'Failed to fetch service account credentials'
        };
      }

      // Parse credentials
      const credentials: GoogleCredentials = JSON.parse(credentialsResponse.data);

      // Create GoogleAuth instance
      this.auth = new GoogleAuth({
        credentials,
        scopes: this.config.scopes,
        projectId: this.config.projectId
      });

      // Create authenticated HTTP client
      this.authenticatedClient = axios.create();
      
      // Add request interceptor for authentication
      this.authenticatedClient.interceptors.request.use(async (config) => {
        if (!this.auth) {
          throw new Error('Authentication not initialized');
        }

        const client = await this.auth.getClient();
        const accessToken = await client.getAccessToken();
        
        if (accessToken.token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${accessToken.token}`;
        }

        return config;
      });

      this.logger.info('API Manager authentication initialized successfully', {
        projectId: credentials.project_id,
        clientEmail: credentials.client_email
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to initialize API Manager', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Make an authenticated API request
   */
  async makeRequest<T>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    if (!this.authenticatedClient) {
      const error = 'API Manager not initialized. Call initialize() first.';
      this.logger.error(error);
      return { success: false, error };
    }

    try {
      this.logger.info('Making authenticated API request', {
        method: config.method || 'GET',
        url: config.url
      });

      const response = await this.authenticatedClient.request<T>(config);

      this.logger.info('API request successful', {
        method: config.method || 'GET',
        url: config.url,
        statusCode: response.status
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };

    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          'Unknown error';
      const statusCode = error?.response?.status;

      this.logger.error('API request failed', {
        method: config.method || 'GET',
        url: config.url,
        error: errorMessage,
        statusCode,
        stack: error?.stack
      });

      return {
        success: false,
        error: errorMessage,
        statusCode
      };
    }
  }

  /**
   * List Vertex AI models (example usage)
   */
  async listVertexAIModels(): Promise<APIResponse<any>> {
    const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${this.config.projectId}/locations/us-central1/models`;
    
    return this.makeRequest({
      method: 'GET',
      url
    });
  }

  /**
   * List Cloud Storage buckets (example usage)
   */
  async listStorageBuckets(): Promise<APIResponse<any>> {
    const url = `https://storage.googleapis.com/storage/v1/b?project=${this.config.projectId}`;
    
    return this.makeRequest({
      method: 'GET',
      url
    });
  }

  /**
   * Test API Manager functionality
   */
  async testConnection(): Promise<APIResponse<any>> {
    try {
      this.logger.info('Testing API Manager connection');

      // Test Secret Manager connection
      const secretTest = await this.secretManager.testConnection(this.config.projectId);
      if (!secretTest.success) {
        return { success: false, error: `Secret Manager test failed: ${secretTest.error}` };
      }

      // Test authentication
      if (!this.auth) {
        return { success: false, error: 'Authentication not initialized' };
      }

      try {
        const client = await this.auth.getClient();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
          return { success: false, error: 'Failed to obtain access token' };
        }
        
        this.logger.info('Access token obtained successfully', {
          tokenLength: accessToken.token.length
        });
      } catch (authError) {
        const authErrorMessage = authError instanceof Error ? authError.message : 'Unknown auth error';
        this.logger.error('Authentication test failed', {
          error: authErrorMessage,
          stack: authError instanceof Error ? authError.stack : undefined
        });
        return { success: false, error: `Authentication failed: ${authErrorMessage}` };
      }

      this.logger.info('API Manager connection test successful');

      return {
        success: true,
        data: {
          secretManagerConnected: true,
          authenticationInitialized: true,
          accessTokenObtained: true
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('API Manager connection test failed', {
        error: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }
}
