import { request } from '../src/request';
import { z } from 'zod';
import { Headers } from 'undici';
import { promisify } from './utils';
import 'dotenv/config';

describe('Fetch with Zod Schema', () => {
  it('Get seal status', () => {
    return promisify(async () => {
      const result = await request(
        {
          url: process.env.VAULT_ENDPOINT_URL! + '/v1/sys/seal-status',
          method: 'GET',
          headers: new Headers({
            'X-Vault-Token': process.env.VAULT_TOKEN!
          })
        },
        {
          response: z.object({
            sealed: z.boolean(),
            t: z.number(),
            n: z.number(),
            progress: z.number()
          })
        }
      );
      console.log(result);
    });
  }).timeout(10_000);
});
