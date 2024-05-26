import { Client, generateCommand } from '@litehex/node-vault';
import { createInstance, destroyInstance, launchVault, sleep } from '@tests/utils';
import { expect } from 'chai';
import { ProxyAgent } from 'undici';
import { z } from 'zod';

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

  it('should get vault health', async () => {
    const resp = await vc.health();
    expect(resp).to.have.property('initialized').be.a('boolean').to.be.true;
  });

  it('should get host info', async () => {
    const resp = await vc.hostInfo();
    expect(resp).to.have.property('data').to.have.property('cpu').to.be.a('array');
    expect(resp).to.have.property('data').to.have.property('host').to.be.a('object');
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

    const result = await fooCommand();
    expect(result).to.have.property('sealed').be.a('boolean');
  });

  it('should get seal status', async () => {
    const result = await vc.sealStatus();

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
    const { root_token, keys } = await createInstance(false);
    vc.token = root_token;

    await sleep(1e3);

    const status = await vc.sealStatus();
    expect(status).to.have.property('sealed').be.a('boolean').to.be.true;
    expect(status).to.have.property('storage_type').be.a('string').to.be.equal('inmem');
    const seal = await vc.seal();
    expect(seal).to.be.true;

    // Wait  seconds to ensure vault is sealed
    await sleep(2e3);

    const unseal = await vc.unseal({
      key: keys[0]
    });
    expect(unseal).to.have.property('sealed', false);
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
    expect(write).to.true;

    const read = await vc.read({
      path: 'secret/test'
    });
    expect(read).to.have.property('data').to.have.property('foo', 'bar');

    const deleted = await vc.delete({
      path: 'secret/test'
    });
    expect(deleted).to.true;
  });

  it('should init vault', async () => {
    launchVault();
    await sleep(1e2);

    const vc = new Client();

    const initStats = await vc.initialized();
    expect(initStats).to.have.property('initialized').be.a('boolean').to.be.false;

    const result = await vc.init({
      secret_shares: 1,
      secret_threshold: 1
    });

    expect(result).to.have.property('keys').be.a('array').lengthOf(1);
    expect(result).to.have.property('keys_base64').be.a('array').lengthOf(1);
    expect(result).to.have.property('root_token').be.a('string');
  });

  it('should support proxy', async function () {
    const { HTTP_PROXY } = process.env;
    if (!HTTP_PROXY) {
      return this.skip();
    }

    const agent = new ProxyAgent(HTTP_PROXY);

    const status = await vc.sealStatus(undefined, { dispatcher: agent });

    expect(status).to.have.property('sealed').be.a('boolean');
  });
});
