import { Client } from '@litehex/node-vault';
import 'dotenv/config';

const vc = new Client({
  endpoint: process.env.VAULT_ENDPOINT_URL,
  token: process.env.VAULT_TOKEN
});

export { vc };
