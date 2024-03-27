import { generateCommand } from '@litehex/node-vault';
import { z } from 'zod';
import { vc } from '@examples/client';

const status = generateCommand({
  path: '/sys/seal-status',
  method: 'GET',
  client: vc,
  // refine: change the request before sending
  refine: (req, args) => {
    req.headers = Object.assign(req.headers || {}, {
      'X-Custom-Header': 'bar'
    });

    console.log(args); // { 'X-Zone': 'foo' }

    return req;
  },
  schema: {
    // path: Schema for template in path
    // searchParams: Any schema for query params
    // headers: Headers schema
    headers: z.object({
      'X-Zone': z.string()
    }),
    // body: Body schema
    response: z.object({
      sealed: z.boolean()
    })
  }
});

// X-Zone will automatically be added to headers
const resp = await status({ 'X-Zone': 'foo' });

console.log(resp); // { sealed: true, ... }
