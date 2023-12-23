import { Client, generateCommand } from '../src';
import { promisify } from './utils';
import { z } from 'zod';
import { expect } from 'chai';

describe('node-vault', () => {
  const client = new Client({
    endpoint: process.env.VAULT_ENDPOINT_URL,
    token: process.env.VAULT_TOKEN
  });

  it('should be able to implement custom command', () => {
    const fooCommand = generateCommand({
      path: '/sys/seal-status',
      method: 'GET',
      client,
      schema: {
        response: z.any()
      }
    });

    return promisify(async () => {
      const result = await fooCommand();
      console.log(result);
    });
  });

  it('should get seal status', () => {
    return promisify(async () => {
      const result = await client.status();
      console.log(result);
    });
  });

  it('should seal and unseal vault', () => {
    return promisify(async () => {
      const result = await client.status();
      if (!result.sealed) {
        console.log('Sealing vault...');
        await client.seal();
      }

      console.log('Unsealing vault...');
      const res = await client.unseal({
        key: process.env.VAULT_UNSEAL_KEY!
      });

      expect(res).to.have.property('sealed', false);

      console.log(res);
    });
  });

  it('should read secret', () => {
    return promisify(async () => {
      const result = await client.read({
        path: 'secret/data/test'
      });
      console.log(result);
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
