import { expect } from 'chai';
import { expectType } from 'tsd';
import { fetch, ProxyAgent } from 'undici';
import * as z from 'zod';

import { Client, generateCommand, VaultError } from '@/index';
import { createVaultContainer, type VaultContainer } from '@/tests/container';
import { sleep } from '@/tests/utils';

describe('node-vault', () => {
  let vault: VaultContainer;
  let vc: Client;

  // Launch
  before(async function () {
    this.timeout(30000);
    vault = await createVaultContainer();
    vc = vault.client;
  });

  // Down
  after(async () => {
    await vault.stop();
  });

  it('should get vault health', async () => {
    const { data, error } = await vc.health();
    expect(error).be.undefined;
    expect(data).have.property('initialized').be.a('boolean').be.true;
  });

  it('should get host info', async () => {
    const { data, error } = await vc.hostInfo();
    expect(error).be.undefined;
    expect(data).have.property('data').have.property('cpu').to.be.a('array');
    expect(data).have.property('data').have.property('host').to.be.a('object');
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
      expectType<VaultError>(error);
      expect(error).be.undefined;
    }

    expect(data).have.property('sealed').be.a('boolean');
  });

  it('should get seal status', async () => {
    const { data, error } = await vc.sealStatus();
    expect(error).be.undefined;

    expect(data).have.property('sealed').be.a('boolean');
    expect(data).have.property('t').be.a('number');
    expect(data).have.property('n').be.a('number');
    expect(data).have.property('progress').be.a('number');
    expect(data).have.property('nonce').be.a('string');
    expect(data).have.property('version').be.a('string');
    expect(data).have.property('build_date').be.a('string');
    expect(data).have.property('migration').be.a('boolean');
    expect(data).have.property('recovery_seal').be.a('boolean');
    expect(data).have.property('storage_type').be.a('string');
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
    expect(mount).have.property('data', true);

    await sleep(1e3);

    const write = await vc.write({
      path: `${mountPath}/test`,
      data: {
        foo: 'bar'
      }
    });
    expect(write).have.property('data').to.true;

    const read = await vc.read({
      path: `${mountPath}/test`
    });
    expect(read.error).be.undefined;
    expect(read?.data).have.property('data').have.property('foo', 'bar');

    const deleted = await vc.delete({
      path: `${mountPath}/test`
    });
    expect(deleted).have.property('data').to.true;
  });

  it('should implement a custom fetcher', async () => {
    let used = false;
    const fancyFetcher = async (url: URL, init: RequestInit) => {
      expect(init).have.property('headers').have.property('X-Vault-Token').to.be.a('string');
      expect(init).have.property('method').to.be.equal('POST');
      expect(url).to.be.instanceof(URL);
      expect(url.toString()).to.equal(`${vc.endpoint}/v1/secret-path/test`);
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

    expect(write).have.property('data').to.true;
    expect(used).be.true;

    delete vc.fetcher;

    const read = await vc.read({
      path: 'secret-path/test'
    });

    expect(read).have.property('data').have.property('data').have.property('foo', 'bar');
  });

  it('should support proxy', async function () {
    const { HTTP_PROXY } = process.env;
    if (!HTTP_PROXY) {
      return this.skip();
    }

    const agent = new ProxyAgent(HTTP_PROXY);
    vc.fetcher = fetch;

    const status = await vc.sealStatus(undefined, { dispatcher: agent });

    expect(status).have.property('data').have.property('sealed').be.a('boolean');
  });
});
