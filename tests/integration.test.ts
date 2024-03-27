import { Client, generateCommand } from '@litehex/node-vault';
import { z } from 'zod';
import { expect } from 'chai';
import { sleep } from '@tests/utils';

describe('node-vault', () => {
  const client = new Client({
    endpoint: process.env.VAULT_ENDPOINT_URL,
    token: process.env.VAULT_TOKEN
  });

  it('should be able to implement custom command', async () => {
    const fooCommand = generateCommand({
      path: '/sys/seal-status',
      method: 'GET',
      client,
      schema: {
        response: z.any()
      }
    });

    const result = await fooCommand();
    expect(result).to.have.property('sealed').be.a('boolean');
  });

  it('should get seal status', async () => {
    const result = await client.status();

    expect(result).to.have.property('sealed').be.a('boolean');
    expect(result).to.have.property('t').be.a('number');
    expect(result).to.have.property('n').be.a('number');
    expect(result).to.have.property('progress').be.a('number');
    expect(result).to.have.property('nonce').be.a('string');
    expect(result).to.have.property('version').be.a('string');
    expect(result).to.have.property('build_date').be.a('string');
    expect(result).to.have.property('migration').be.a('boolean');
    expect(result).to.have.property('recovery_seal').be.a('boolean');
    expect(result).to.have.property('storage_type').be.a('string');
  });

  it('should seal and unseal vault', async () => {
    const result = await client.status();
    if (!result.sealed) {
      await client.seal();
    }

    // Wait 5 seconds to ensure vault is sealed
    await sleep(5000);

    const res = await client.unseal({
      key: process.env.VAULT_UNSEAL_KEY!
    });

    expect(res).to.have.property('sealed', false);
  });

  it('should write, read and delete secret', async () => {
    // Write
    {
      const result = await client.write({
        path: 'secret/data/test',
        data: {
          foo: 'bar'
        }
      });
      expect(result).to.have.property('data');
    }
    // Read
    {
      const result = await client.read({
        path: 'secret/data/test'
      });
      expect(result)
        .to.have.property('data')
        .to.have.property('data')
        .to.have.property('foo', 'bar');
    }
    // Delete
    {
      const result = await client.delete({
        path: 'secret/data/test'
      });
      expect(result).to.true;
    }
  });

  it('should init vault', async () => {
    // Skip if already initialized
    const status = await client.status();
    if (status.initialized) {
      return;
    }

    const result = await client.init({
      secret_shares: 1,
      secret_threshold: 1
    });
    console.log(result);
  });
});
