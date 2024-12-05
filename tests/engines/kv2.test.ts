import { expect } from 'chai';
import { expectType } from 'tsd';

import { Client } from '@/index';
import { createInstance, destroyInstance, sleep } from '@/tests/utils';

describe('Key/Value Secrets Engine - Version 2', () => {
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

    await vc.mount({ mountPath, type: 'kv-v2' });

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
    const mounted = await vc.mount({
      mountPath,
      type: 'kv-v2'
    });

    expect(mounted).have.property('data').to.true;

    // Verify
    const { data: info, error } = await vc.kv2.info({
      mountPath
    });

    if (error) {
      expectType<undefined>(info);
      return;
    }

    expectType<undefined>(error);
    expect(info).have.property('type', 'kv');
    expect(info).have.property('options').have.property('version', '2');
  });

  it('should create a secret path and write a new version', async () => {
    await createEngine();

    // Write
    const { data: write } = await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: {
        foo: 'bar'
      }
    });
    expect(write).have.property('data').have.property('version', 1);

    // Write new version
    const { data: newWrite } = await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: {
        baz: 'qux'
      }
    });
    expect(newWrite).have.property('data').have.property('version', 2);
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
    expect(deleted).have.property('data').be.true;

    const undeleted = await vc.kv2.undelete({
      mountPath,
      path: 'new-test',
      versions: [1]
    });
    expect(undeleted).have.property('data').be.true;
  });

  it('should be able to read the secret', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const { data, error } = await vc.kv2.read({
      mountPath,
      path: 'new-test'
    });
    expect(error).be.undefined;
    expect(data).have.property('data').have.property('data').have.property('foo', 'bar');
    expect(data).have.property('data').have.property('metadata').have.property('version', 1);
  });

  it('should delete the latest version', async () => {
    await createEngine();

    await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: { foo: 'bar' }
    });

    const { data, error } = await vc.kv2.readMetadata({
      mountPath,
      path: 'new-test'
    });

    expect(error).be.undefined;
    expect(data).have.property('data').have.property('current_version', 1);
    expect(data).have.property('data').have.property('custom_metadata');
    expect(data)
      .have.property('data')
      .have.property('versions')
      .have.property('1')
      .have.property('destroyed', false);

    const deleted = await vc.kv2.deleteLatest({
      mountPath,
      path: 'new-test'
    });
    expect(deleted).have.property('data').be.true;
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
    expect(writeInfo).have.property('data').be.true;

    const patchMeta = await vc.kv2.patchMetadata({
      mountPath,
      path: 'new-test',
      custom_metadata: {
        foo: 'baz'
      }
    });
    expect(patchMeta).have.property('data').be.true;

    const metadata = await vc.kv2.readMetadata({
      mountPath,
      path: 'new-test'
    });
    expect(metadata)
      .have.property('data')
      .have.property('data')
      .have.property('current_version', 1);
    expect(metadata)
      .have.property('data')
      .have.property('data')
      .have.property('custom_metadata')
      .have.property('foo', 'baz');
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

    expect(deleted).have.property('data').be.true;
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

    expect(keys)
      .have.property('data')
      .have.property('data')
      .have.property('keys')
      .to.include('new-secret');
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

    expect(keys)
      .have.property('data')
      .have.property('data')
      .have.property('subkeys')
      .have.property('foo');
  });

  it('should read engine config', async () => {
    await createEngine();

    const writeConfig = await vc.kv2.config({
      mountPath,
      max_versions: 10
    });

    expect(writeConfig).have.property('data').be.true;

    const config = await vc.kv2.readConfig({
      mountPath
    });

    expect(config).have.property('data').have.property('data').have.property('max_versions', 10);
  });
});
