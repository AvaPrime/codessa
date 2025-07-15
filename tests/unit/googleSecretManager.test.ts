import { GoogleSecretManager } from '../../src/managers/googleSecretManager';
import { SecretConfig } from '../../src/types';

// Mock the Google Secret Manager client
const mockClient = {
  accessSecretVersion: jest.fn(),
  listSecrets: jest.fn(),
};

jest.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: jest.fn().mockImplementation(() => mockClient),
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }),
}));

describe('GoogleSecretManager', () => {
  let secretManager: GoogleSecretManager;

  beforeEach(() => {
    secretManager = new GoogleSecretManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSecret', () => {
    it('should successfully fetch a secret', async () => {
      const mockSecret = 'test-secret-value';
      mockClient.accessSecretVersion.mockResolvedValueOnce([{
        payload: {
          data: Buffer.from(mockSecret, 'utf8')
        }
      }]);

      const config: SecretConfig = {
        projectId: 'test-project',
        secretName: 'test-secret'
      };

      const result = await secretManager.getSecret(config);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockSecret);
      expect(mockClient.accessSecretVersion).toHaveBeenCalledWith({
        name: 'projects/test-project/secrets/test-secret/versions/latest'
      });
    });

    it('should handle empty secret payload', async () => {
      mockClient.accessSecretVersion.mockResolvedValueOnce([{
        payload: {
          data: null
        }
      }]);

      const config: SecretConfig = {
        projectId: 'test-project',
        secretName: 'test-secret'
      };

      const result = await secretManager.getSecret(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Secret payload is empty or undefined');
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Permission denied';
      mockClient.accessSecretVersion.mockRejectedValueOnce(new Error(errorMessage));

      const config: SecretConfig = {
        projectId: 'test-project',
        secretName: 'test-secret'
      };

      const result = await secretManager.getSecret(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should use specified version', async () => {
      const mockSecret = 'test-secret-value';
      mockClient.accessSecretVersion.mockResolvedValueOnce([{
        payload: {
          data: Buffer.from(mockSecret, 'utf8')
        }
      }]);

      const config: SecretConfig = {
        projectId: 'test-project',
        secretName: 'test-secret',
        version: '1'
      };

      await secretManager.getSecret(config);

      expect(mockClient.accessSecretVersion).toHaveBeenCalledWith({
        name: 'projects/test-project/secrets/test-secret/versions/1'
      });
    });
  });

  describe('getServiceAccountCredentials', () => {
    it('should successfully fetch and validate service account credentials', async () => {
      const mockCredentials = {
        type: 'service_account',
        project_id: 'test-project',
        private_key: '-----BEGIN PRIVATE KEY-----\\ntest-key\\n-----END PRIVATE KEY-----',
        client_email: 'test@test-project.iam.gserviceaccount.com',
        client_id: '123456789',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com',
        private_key_id: 'test-key-id'
      };

      mockClient.accessSecretVersion.mockResolvedValueOnce([{
        payload: {
          data: Buffer.from(JSON.stringify(mockCredentials), 'utf8')
        }
      }]);

      const config: SecretConfig = {
        projectId: 'test-project',
        secretName: 'test-secret'
      };

      const result = await secretManager.getServiceAccountCredentials(config);

      expect(result.success).toBe(true);
      expect(result.data).toBe(JSON.stringify(mockCredentials));
    });

    it('should handle invalid JSON', async () => {
      mockClient.accessSecretVersion.mockResolvedValueOnce([{
        payload: {
          data: Buffer.from('invalid-json', 'utf8')
        }
      }]);

      const config: SecretConfig = {
        projectId: 'test-project',
        secretName: 'test-secret'
      };

      const result = await secretManager.getServiceAccountCredentials(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON in service account credentials');
    });

    it('should handle missing required fields', async () => {
      const invalidCredentials = {
        type: 'service_account',
        // Missing project_id, private_key, client_email
      };

      mockClient.accessSecretVersion.mockResolvedValueOnce([{
        payload: {
          data: Buffer.from(JSON.stringify(invalidCredentials), 'utf8')
        }
      }]);

      const config: SecretConfig = {
        projectId: 'test-project',
        secretName: 'test-secret'
      };

      const result = await secretManager.getServiceAccountCredentials(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field in service account credentials');
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      mockClient.listSecrets.mockResolvedValueOnce([
        [{ name: 'projects/test-project/secrets/secret1' }]
      ]);

      const result = await secretManager.testConnection('test-project');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Connection successful');
      expect(mockClient.listSecrets).toHaveBeenCalledWith({
        parent: 'projects/test-project',
        pageSize: 1
      });
    });

    it('should handle connection errors', async () => {
      const errorMessage = 'Connection failed';
      mockClient.listSecrets.mockRejectedValueOnce(new Error(errorMessage));

      const result = await secretManager.testConnection('test-project');

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });
});
