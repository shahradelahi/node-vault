import { Client } from '@litehex/node-vault';
import { ProxyAgent } from 'undici';

const agent = new ProxyAgent('http://localhost:8080');

const vc = new Client({
  // ... other params
  request: {
    dispatcher: agent,
    headers: {
      'X-Custom-Header': 'value'
    }
  }
});
