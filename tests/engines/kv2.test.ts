import { Client } from '../../src';
import { promisify } from '../utils';
import 'dotenv/config';

describe('node-vault', () => {
  const client = new Client({
    endpoint: process.env.VAULT_ENDPOINT_URL,
    token: process.env.VAULT_TOKEN
  });

  const kv2 = client.kv2();

  it('should create a secret path and write a new version', () => {
    return promisify(async () => {
      const createResult = await kv2.write({
        mountPath: 'secret',
        path: 'new-test',
        data: {
          foo: 'bar'
        }
      });
      console.log('created', createResult);
      const writeNew = await kv2.write({
        mountPath: 'secret',
        path: 'new-test',
        data: {
          baz: 'qux'
        }
      });
      console.log('wrote new version', writeNew);
    });
  });

  it('should delete a version and undelete it', () => {
    return promisify(async () => {
      await kv2.delete({
        mountPath: 'secret',
        path: 'new-test',
        versions: [1]
      });
      console.log('deleted');
      await kv2.undelete({
        mountPath: 'secret',
        path: 'new-test',
        versions: [1]
      });
      console.log('undeleted');
    });
  });

  it('should be able to read the secret', () => {
    return promisify(async () => {
      const { data } = await kv2.read({
        mountPath: 'secret',
        path: 'new-test'
      });
      console.log(data);
    });
  });

  it('should delete the latest version', () => {
    return promisify(async () => {
      const metadata = await kv2.readMetadata({
        mountPath: 'secret',
        path: 'new-test'
      });
      console.log('versions', metadata.data.versions);
      await kv2.deleteLatestVersion({
        mountPath: 'secret',
        path: 'new-test'
      });
      console.log('deleted');
    });
  });

  it('should write and read metadata', () => {
    return promisify(async () => {
      await kv2.writeMetadata({
        mountPath: 'secret',
        path: 'new-test',
        custom_metadata: {
          foo: 'bar'
        }
      });
      console.log('wrote metadata');
      const metadata = await kv2.readMetadata({
        mountPath: 'secret',
        path: 'new-test'
      });
      console.log(metadata);
    });
  });

  it('should delete metadata and all versions', () => {
    return promisify(async () => {
      await kv2.deleteMetadata({
        mountPath: 'secret',
        path: 'new-test'
      });
      console.log('deleted metadata');
    });
  });
});
