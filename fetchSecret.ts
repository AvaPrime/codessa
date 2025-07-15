import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

async function accessSecretVersion() {
  const client = new SecretManagerServiceClient();

  const name = 'projects/ava-prime-459710/secrets/codessa-service-account-key/versions/latest';

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload.data.toString();
    console.log(`Secret payload:`, payload);
  } catch (err) {
    console.error('Failed to access secret version:', err);
  }
}

accessSecretVersion();
