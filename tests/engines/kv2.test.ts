import { afterAll, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Client } from '@/index';
import { createVaultContainer, type VaultContainer } from '@/tests/container';
import { sleep } from '@/tests/utils';

describe('Key/Value Secrets Engine - Version 2', () => {
  let vault: VaultContainer;
  let vc: Client;
  const mountPath = 'my-secret';

  const createEngine = async () => {
    try {
      await vc.unmount({ mountPath });
    } catch (e) {
      // ignore
    }

    await sleep(100);

    await vc.mount({ mountPath, type: 'kv-v2' });

    await sleep(100);
  };

  // Launch
  beforeAll(async function () {
    vault = await createVaultContainer();
    vc = vault.client;
  });

  // Down
  afterAll(async () => {
    await vault.stop();
  });

  it('should mount the secrets engine', async () => {
    // Create
    const mounted = await vc.mount({
      mountPath,
      type: 'kv-v2'
    });

    expect(mounted.data).toBe(true);

    // Verify
    const { data: info, error } = await vc.kv2.info({
      mountPath
    });

    if (error) {
      expectTypeOf<undefined>(info);
      return;
    }

    expectTypeOf<undefined>(error);
    expect(info.type).toBe('kv');
    expect(info.options).toHaveProperty('version', '2');
  });

  it('should create a secret path and write a new version', async () => {
    await createEngine();

    // Write
    const writeResult = await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: {
        foo: 'bar'
      }
    });
    if (writeResult.error) {
      throw writeResult.error;
    }
    expect(writeResult.data.data.version).toBe(1);

    // Write new version
    const newWriteResult = await vc.kv2.write({
      mountPath,
      path: 'new-test',
      data: {
        baz: 'qux'
      }
    });
    if (newWriteResult.error) {
      throw newWriteResult.error;
    }
    expect(newWriteResult.data.data.version).toBe(2);
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
    expect(deleted.data).toBe(true);

    const undeleted = await vc.kv2.undelete({
      mountPath,
      path: 'new-test',
      versions: [1]
    });
    expect(undeleted.data).toBe(true);
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
    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(data?.data?.data?.['foo']).toBe('bar');
    expect(data?.data?.metadata?.version).toBe(1);
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

    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(data?.data?.current_version).toBe(1);
    expect(data?.data?.custom_metadata).toBeDefined();
    expect(data?.data?.versions?.['1']?.destroyed).toBe(false);

    const deleted = await vc.kv2.deleteLatest({
      mountPath,
      path: 'new-test'
    });
    expect(deleted.data).toBe(true);
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
    expect(writeInfo.data).toBe(true);

    const patchMeta = await vc.kv2.patchMetadata({
      mountPath,
      path: 'new-test',
      custom_metadata: {
        foo: 'baz'
      }
    });
    expect(patchMeta.data).toBe(true);

    const metadata = await vc.kv2.readMetadata({
      mountPath,
      path: 'new-test'
    });
    if (metadata.error) {
      throw metadata.error;
    }
    expect(metadata.data?.data?.current_version).toBe(1);
    expect(metadata.data?.data?.custom_metadata).toHaveProperty('foo', 'baz');
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

    expect(deleted.data).toBe(true);
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
    if (keys.error) {
      throw keys.error;
    }
    expect(keys.data?.data?.keys).toContain('new-secret');
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
    if (keys.error) {
      throw keys.error;
    }
    expect(keys.data?.data?.subkeys?.['foo']).toBeDefined();
  });

  it('should read engine config', async () => {
    await createEngine();

    const writeConfig = await vc.kv2.config({
      mountPath,
      max_versions: 10
    });

    expect(writeConfig.data).toBe(true);

    const config = await vc.kv2.readConfig({
      mountPath
    });
    if (config.error) {
      throw config.error;
    }
    expect(config.data?.data?.max_versions).toBe(10);
  });

  it('should handle 404 error when reading non-existent secret', async () => {
    await createEngine();

    // Try to read a secret that doesn't exist
    const { data, error } = await vc.kv2.read({
      mountPath,
      path: 'non-existent-secret-path-12345'
    });

    // Should have an error, not data
    expect(error).toBeDefined();
    expect(data).toBeUndefined();

    // The error should be a VaultError with a proper message
    if (error) {
      expect(error.constructor.name).toBe('VaultError');
      expect(error.message).toBe('Not Found');
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});
