import { Client } from '@/index.ts';
import { promisify } from './utils.ts';
import 'dotenv/config';

describe('node-vault', () => {
  const client = new Client({
    endpoint: process.env.VAULT_ENDPOINT_URL,
    token: process.env.VAULT_TOKEN
  });

  it('should get seal status', () => {
    return promisify(async () => {
      const result = await client.status();
      console.log(result);
    });
  });
});
