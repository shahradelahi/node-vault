import { fetch, ProxyAgent } from 'undici';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as z from 'zod';

import { Client, generateCommand } from '@/index';
import { createVaultContainer, type VaultContainer } from '@/tests/container';
import { sleep } from '@/tests/utils';

describe('node-vault', () => {
  let vault: VaultContainer;
  let vc: Client;

  // Launch
  beforeAll(async function () {
    vault = await createVaultContainer();
    vc = vault.client;
  });

  // Down
  afterAll(async function () {
    await vault.stop();
  });

  it('should get vault health', async () => {
    const { data, error } = await vc.health();
    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(data.initialized).toBe(true);
  });

  it('should get host info', async () => {
    const { data, error } = await vc.hostInfo();
    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(data.data.cpu).toBeInstanceOf(Array);
    expect(data.data.host).toBeTypeOf('object');
  });

  it('should be able to implement custom command', async () => {
    const fooCommand = generateCommand({
      path: '/sys/seal-status',
      method: 'GET',
      client: vc,
      schema: {
        response: z.any()
      }
    });

    const { data, error } = await fooCommand();
    if (error) {
      throw error;
    }
    expect(data.sealed).toBeTypeOf('boolean');
  });

  it('should get seal status', async () => {
    const { data, error } = await vc.sealStatus();
    expect(error).toBeUndefined();
    if (error) {
      throw error;
    }
    expect(data.sealed).toBeTypeOf('boolean');
    expect(data.t).toBeTypeOf('number');
    expect(data.n).toBeTypeOf('number');
    expect(data.progress).toBeTypeOf('number');
    expect(data.nonce).toBeTypeOf('string');
    expect(data.version).toBeTypeOf('string');
    expect(data.build_date).toBeTypeOf('string');
    expect(data.migration).toBeTypeOf('boolean');
    expect(data.recovery_seal).toBeTypeOf('boolean');
    expect(data.storage_type).toBeTypeOf('string');
  });

  it('should write, read and delete secret', async () => {
    const mountPath = 'my-new-secret';

    const mount = await vc.mount({
      type: 'kv',
      mountPath,
      options: {
        version: 1
      }
    });
    expect(mount.data).toBe(true);

    await sleep(1e3);

    const write = await vc.write({
      path: `${mountPath}/test`,
      data: {
        foo: 'bar'
      }
    });
    expect(write.data).toBe(true);

    const read = await vc.read({
      path: `${mountPath}/test`
    });
    expect(read.error).toBeUndefined();
    if (read.error) {
      throw read.error;
    }
    expect(read.data?.['data']?.['foo']).toBe('bar');

    const deleted = await vc.delete({
      path: `${mountPath}/test`
    });
    expect(deleted.data).toBe(true);
  });

  it('should implement a custom fetcher', async () => {
    let used = false;
    const fancyFetcher = async (url: URL, init: RequestInit) => {
      if (!init.headers) {
        throw new Error('Headers are undefined');
      }
      expect((init.headers as Record<string, string>)['X-Vault-Token']).toBeTypeOf('string');
      expect(init.method).toBe('POST');
      expect(url).toBeInstanceOf(URL);
      expect(url.toString()).toBe(`${vc.endpoint}/v1/secret-path/test`);
      used = true;
      // @ts-expect-error Init type has some missing properties
      return fetch(url, init);
    };

    await vc.mount({ type: 'kv', mountPath: 'secret-path' });

    vc.fetcher = fancyFetcher;

    const write = await vc.write({
      path: 'secret-path/test',
      data: {
        foo: 'bar'
      }
    });

    expect(write.data).toBe(true);
    expect(used).toBe(true);

    delete vc.fetcher;

    const read = await vc.read({
      path: 'secret-path/test'
    });
    if (read.error) {
      throw read.error;
    }
    expect(read.data?.['data']?.['foo']).toBe('bar');
  });

  it('should support proxy', async function () {
    const { HTTP_PROXY } = process.env;
    if (!HTTP_PROXY) {
      return;
    }

    const agent = new ProxyAgent(HTTP_PROXY);
    vc.fetcher = fetch;

    const status = await vc.sealStatus(undefined, { dispatcher: agent });

    if (status.error) {
      throw status.error;
    }
    expect(status.data.sealed).toBeTypeOf('boolean');
  });
});
