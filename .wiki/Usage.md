## Custom Command

At times, you may need to use a command or endpoint that is not available in the library, or you may want to use it in a
different way. Here is an example of how to do that:

```typescript
import { Client } from '@litehex/node-vault';
import { z } from 'zod';

const vc = new Client({
  /** ... */
});

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
    // path: z.object({}), Schema for template in path
    // searchParams: z.object({}), Any schema for query params
    // headers: z.object({}),  Headers schema
    headers: z.object({
      'X-Zone': z.string()
    }),
    // body: z.object({}), // Schema for request body
    response: z.object({
      sealed: z.boolean()
    })
  }
});

await status({ 'X-Zone': 'foo' });
```

If you do not understand how you must write your command, please refer
to [the source code](https://github.com/shahradelahi/node-vault). There is various of the working code in the source
code.

## Send Requests Using Proxy

To connect to a Vault server in a private network, you can use proxies to send the request.

First, install the `undici` package, which is the default HTTP client for Node.js:

```bash
npm install undici
```

Then, using the following code, create a proxy agent and pass it to the client:

```typescript
import { Client } from '@litehex/node-vault';
import { ProxyAgent } from 'undici';

const agent = new ProxyAgent('http://localhost:8080');

const vc = new Client({
  // ... other params
  request: { dispatcher: agent }
});

// Each individual command accepts the a second parameter to modify the request
const status = vc.sealStatus(undefined, { dispatcher: agent });
```

## Custom Fetcher

By default, the client will use the `fetch` function from `undici`. If you want to use a custom fetcher, you can do so by passing `fetcher` to the client.

```typescript
async function fetcher(url: URL, init: RequestInit) {
  console.log(`fetching ${url.toString()}`);
  return fetch(url, init);
}

const vc = new Client({
  // ... other params
  fetcher
});

// Or you already initialize the client and want to change it or remove it
vc.fetcher = fetcher;
delete vc.fetcher;
```
