import { expect } from 'chai';
import { expectType } from 'tsd';
import { fetch, ProxyAgent } from 'undici';
import * as z from 'zod';

import { Client, generateCommand, VaultError } from '@/index';
import { createInstance, destroyInstance, launchVault, sleep } from '@/tests/utils';

describe('node-vault', () => {
  const vc = new Client();

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

  it('should handle errors', async () => {
    const res = await vc.init({
      secret_shares: 1,
      secret_threshold: 1
    });
    expect(res)
      .have.property('error')
      .be.instanceof(VaultError)
      .have.property('message')
      .be.equal('Vault is already initialized');
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

  it('should seal and unseal vault', async () => {
    const { root_token, keys } = await createInstance(false);
    vc.token = root_token;

    await sleep(1e3);

    const status = await vc.sealStatus();
    expect(status).have.property('data').have.property('sealed').be.a('boolean').be.true;
    expect(status)
      .have.property('data')
      .have.property('storage_type')
      .be.a('string')
      .to.be.equal('inmem');
    const seal = await vc.seal();
    expect(seal).have.property('data').be.true;

    // Wait  seconds to ensure vault is sealed
    await sleep(2e3);

    const unseal = await vc.unseal({
      key: keys[0]
    });
    expect(unseal).have.property('data').have.property('sealed', false);
  });

  it('should write, read and delete secret', async () => {
    await vc.mount({
      type: 'kv',
      mountPath: 'secret'
    });

    await sleep(1e3);

    const write = await vc.write({
      path: 'secret/test',
      data: {
        foo: 'bar'
      }
    });
    expect(write).have.property('data').to.true;

    const read = await vc.read({
      path: 'secret/test'
    });
    expect(read).have.property('data').have.property('data').have.property('foo', 'bar');

    const deleted = await vc.delete({
      path: 'secret/test'
    });
    expect(deleted).have.property('data').to.true;
  });

  it('should implement a custom fetcher', async () => {
    let used = false;
    const fancyFetcher = async (url: URL, init: RequestInit) => {
      expect(init).have.property('headers').have.property('X-Vault-Token').to.be.a('string');
      expect(init).have.property('method').to.be.equal('POST');
      expect(url).to.be.instanceof(URL);
      expect(url.toString()).to.equal('http://127.0.0.1:8200/v1/secret-path/test');
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

  it('should init vault', async () => {
    launchVault();
    await sleep(1e2);

    const vc = new Client();

    const init = await vc.initialized();
    expect(init).have.property('data').have.property('initialized').be.a('boolean').be.false;

    const result = await vc.init({
      secret_shares: 1,
      secret_threshold: 1
    });

    expect(result).have.property('data').have.property('keys').be.a('array').lengthOf(1);
    expect(result).have.property('data').have.property('keys_base64').be.a('array').lengthOf(1);
    expect(result).have.property('data').have.property('root_token').be.a('string');
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
