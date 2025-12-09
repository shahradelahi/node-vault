import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Client } from '@/index';
import { createVaultContainer, type VaultContainer } from '@/tests/container';
import { sleep } from '@/tests/utils';

describe('Key/Value Secrets Engine - Version 1', () => {
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

    await vc.mount({ mountPath, type: 'kv' });

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
    const mount = await vc.mount({
      mountPath,
      type: 'kv'
    });

    expect(mount.data).toBe(true);

    // Verify
    const result = await vc.kv.info({
      mountPath
    });

    if (result.error) {
      throw result.error;
    }
    expect(result.data.type).toBe('kv');
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
    expect(write).not.toHaveProperty('error');
    expect(write.data).toBeTypeOf('boolean');

    // Write new version
    const newWrite = await vc.kv.write({
      mountPath,
      path: 'new-test',
      data: {
        baz: 'qux'
      }
    });
    expect(newWrite).not.toHaveProperty('error');
    expect(newWrite.data).toBeTypeOf('boolean');
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
    expect(deleted.data).toBe(true);
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

    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(data?.data?.['foo']).toBe('bar');
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
    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(keys?.data?.keys).toContain('new-secret');
  });
});
