import { Client } from '@litehex/node-vault';
import { createInstance, destroyInstance, sleep } from '@tests/utils';
import { expect } from 'chai';

describe('Key/Value Version 2 Secrets Engine', () => {
  const vc = new Client();

  const mountPath = 'my-secret';

  const createEngine = async () => {
    const resp = await vc.engineInfo({
      mountPath
    });

    if (!('errors' in resp)) {
      await vc.unmount({ mountPath });
    }

    await sleep(1e3);

    await vc.mount({ mountPath, type: 'kv-v2' });
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
    {
      const result = await vc.mount({
        mountPath,
        type: 'kv-v2'
      });

      expect(result).to.true;
    }

    // Verify
    {
      const result = await vc.engineInfo({
        mountPath
      });

      expect(result).to.have.property('type', 'kv');
      expect(result).to.have.property('options').to.have.property('version', '2');
    }
  });

  it('should create a secret path and write a new version', async () => {
    await createEngine();

    // Write
    const write = await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: {
        foo: 'bar'
      }
    });

    expect(write).not.have.property('errors');
    expect(write).to.have.property('data');
    expect(write).to.have.property('data').to.have.property('version', 1);

    // Write new version
    const newWrite = await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: {
        baz: 'qux'
      }
    });

    expect(newWrite).not.have.property('errors');
    expect(newWrite).to.have.property('data');
    expect(newWrite).to.have.property('data').to.have.property('version', 2);
  });

  it('should delete a version and undelete it', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const deleted = await vc.kv2.delete({
      mountPath,
      path: 'new-test',
      versions: [1]
    });
    expect(deleted).to.be.true;

    const undeleted = await vc.kv2.undelete({
      mountPath,
      path: 'new-test',
      versions: [1]
    });
    expect(undeleted).to.be.true;
  });

  it('should be able to read the secret', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const result = await vc.kv2.read({
      mountPath,
      path: 'new-test'
    });

    expect(result).to.have.property('data').to.have.property('data').to.have.property('foo', 'bar');
    expect(result)
      .to.have.property('data')
      .to.have.property('metadata')
      .to.have.property('version', 1);
  });

  it('should delete the latest version', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const metadata = await vc.kv2.readMetadata({
      mountPath,
      path: 'new-test'
    });

    expect(metadata).to.have.property('data').to.have.property('current_version', 1);
    expect(metadata).to.have.property('data').to.have.property('custom_metadata');
    expect(metadata)
      .to.have.property('data')
      .to.have.property('versions')
      .to.have.property('1')
      .to.have.property('destroyed', false);

    const deleted = await vc.kv2.deleteLatestVersion({
      mountPath,
      path: 'new-test'
    });
    expect(deleted).to.be.true;
  });

  it('should write and read metadata', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const writeInfo = await vc.kv2.writeMetadata({
      mountPath,
      path: 'new-test',
      custom_metadata: {
        foo: 'bar'
      }
    });
    expect(writeInfo).to.be.true;

    const patchMeta = await vc.kv2.patchMetadata({
      mountPath,
      path: 'new-test',
      custom_metadata: {
        foo: 'baz'
      }
    });
    expect(patchMeta).to.be.true;

    const metadata = await vc.kv2.readMetadata({
      mountPath,
      path: 'new-test'
    });
    expect(metadata).to.have.property('data').to.have.property('current_version', 1);
    expect(metadata)
      .to.have.property('data')
      .to.have.property('custom_metadata')
      .to.have.property('foo', 'baz');
  });

  it('should delete metadata and all versions', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const deleted = await vc.kv2.deleteMetadata({
      mountPath,
      path: 'new-test'
    });

    expect(deleted).to.be.true;
  });

  it('should list keys', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'deep/new-secret',
      data: { foo: 'bar' }
    });

    const keys = await vc.kv2.list({
      mountPath,
      path: 'deep'
    });

    expect(keys).to.have.property('data').to.have.property('keys').to.include('new-secret');
  });

  it('should read subkeys', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'deep/new-secret',
      data: { foo: 'bar' }
    });

    const keys = await vc.kv2.subKeys({
      mountPath,
      path: 'deep/new-secret'
    });

    expect(keys).to.have.property('data').to.have.property('subkeys').to.have.property('foo');
  });

  it('should read engine config', async () => {
    await createEngine();

    const writeConfig = await vc.kv2.config({
      mountPath,
      max_versions: 10
    });

    expect(writeConfig).to.be.true;

    const config = await vc.kv2.readConfig({
      mountPath
    });

    expect(config).to.have.property('data').to.have.property('max_versions', 10);
  });
});
