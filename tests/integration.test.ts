import { Client } from '../src';
import { promisify } from './utils';
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

  it('should read secret', () => {
    return promisify(async () => {
      const result = await client.read(
        {
          path: 'secret/data/test',
          list: false
        },
        { strictSchema: false }
      );
      console.log(result);
      if (result && result.data) {
        console.log(result.data.data);
      }
    });
  });

  it('should write secret', () => {
    return promisify(async () => {
      const result = await client.write({
        path: 'secret/data/test',
        data: {
          foo: 'bar'
        }
      });
      console.log(result);
    });
  });

  it('should init vault', () => {
    return promisify(async () => {
      const vc = new Client();
      const result = await vc.init({
        secret_shares: 1,
        secret_threshold: 1
      });
      console.log(result);
    });
  });
});
