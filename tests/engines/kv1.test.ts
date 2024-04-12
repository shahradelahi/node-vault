import { Client } from '@litehex/node-vault';
import { createInstance, destroyInstance, sleep } from '@tests/utils';
import { expect } from 'chai';

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

    expect(mount).to.true;

    // Verify
    const result = await vc.kv.info({
      mountPath
    });

    expect(result).to.have.property('type', 'kv');
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

    expect(write).not.have.property('errors');

    // Write new version
    const newWrite = await vc.kv.write({
      mountPath,
      path: 'new-test',
      data: {
        baz: 'qux'
      }
    });

    expect(newWrite).not.have.property('errors');
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
    expect(deleted).to.be.true;
  });

  it('should be able to read the secret', async () => {
    await createEngine();

    await vc.kv.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const result = await vc.kv.read({
      mountPath,
      path: 'new-test'
    });

    expect(result).to.have.property('data').to.have.property('foo', 'bar');
  });

  it('should list keys', async () => {
    await createEngine();

    await vc.kv.write({
      mountPath,
      path: 'deep/new-secret',
      data: { foo: 'bar' }
    });

    const keys = await vc.kv.list({
      mountPath,
      path: 'deep'
    });

    expect(keys).to.have.property('data').to.have.property('keys').to.include('new-secret');
  });
});
