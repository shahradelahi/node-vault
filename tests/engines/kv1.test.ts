import { expect } from 'chai';

import { Client } from '@/index';
import { createInstance, destroyInstance, sleep } from '@/tests/utils';

describe('Key/Value Secrets Engine - Version 1', () => {
  const vc = new Client();

  const mountPath = 'my-secret';

  const createEngine = async () => {
    const resp = await vc.engineInfo({
      mountPath
    });

    if (!('errors' in resp)) {
      await vc.unmount({ mountPath });
    }

    await sleep(500);

    await vc.mount({ mountPath, type: 'kv' });

    await sleep(500);
  };

  // Launch
  before(async () => {
    const { root_token } = await createInstance();
    vc.token = root_token;
  });

  // Down
  after(async () => {
    destroyInstance();
    await sleep(2e3);
  });

  it('should mount the secrets engine', async () => {
    // Create
    const mount = await vc.mount({
      mountPath,
      type: 'kv'
    });

    expect(mount).have.property('data').to.true;

    // Verify
    const result = await vc.kv.info({
      mountPath
    });

    expect(result).have.property('data').have.property('type', 'kv');
  });

  it('should create a secret path and write a new version', async () => {
    await createEngine();

    // Write
    const write = await vc.kv.write({
      mountPath,
      path: 'new-test',
      data: {
        foo: 'bar'
      }
    });
    expect(write).not.have.property('error');
    expect(write).have.property('data').be.a('boolean');

    // Write new version
    const newWrite = await vc.kv.write({
      mountPath,
      path: 'new-test',
      data: {
        baz: 'qux'
      }
    });
    expect(newWrite).not.have.property('error');
    expect(newWrite).have.property('data').be.a('boolean');
  });

  it('should delete a secret path', async () => {
    await createEngine();

    await vc.kv.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const deleted = await vc.kv.delete({
      mountPath,
      path: 'new-test'
    });
    expect(deleted).have.property('data').be.true;
  });

  it('should be able to read the secret', async () => {
    await createEngine();

    await vc.kv.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const { data, error } = await vc.kv.read({
      mountPath,
      path: 'new-test'
    });

    expect(error).be.undefined;
    expect(data).have.property('data').have.property('foo', 'bar');
  });

  it('should list keys', async () => {
    await createEngine();

    await vc.kv.write({
      mountPath,
      path: 'deep/new-secret',
      data: { foo: 'bar' }
    });

    const { data: keys, error } = await vc.kv.list({
      mountPath,
      path: 'deep'
    });
    expect(error).be.undefined;
    expect(keys).have.property('data').have.property('keys').to.include('new-secret');
  });
});
