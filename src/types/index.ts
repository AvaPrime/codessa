export interface SecretConfig {
  projectId: string;
  secretName: string;
  version?: string;
}

export interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface APIManagerConfig {
  projectId: string;
  secretName: string;
  scopes: string[];
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface SecretManagerResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface LoggerOptions {
  level: string;
  service: string;
  environment: string;
}
