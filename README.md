# node-vault

A Javascript client for the HTTP API of HashiCorp's [vault](https://vaultproject.io/) with a focus on ease of use.

```bash
npm install @litehex/node-vault
```

### Usage

##### Init and unseal vault

```ts
import { Client } from '@litehex/node-vault';

// Get a new instance of the client
const vc = new Client({
  apiVersion: 'v1', // default
  endpoint: 'http://127.0.0.1:8200', // default
  token: 'hv.xxxxxxxxxxxxxxxxxxxxx' // Optional incase of you want to initialize the vault
});

// Init vault
vc.init({ secret_shares: 1, secret_threshold: 1 }).then((res) => {
  const { keys, root_token } = res;
  vc.token = root_token;
  // Unseal vault
  vc.unseal({ secret_shares: 1, key: keys[0] });
});
```

##### Write, read and delete secrets

```ts
vc.write({ path: 'secret/hello', data: { foo: 'bar' } }).then(async () => {
  const data = await vc.read({ path: 'secret/hello' });
  console.log(data); // { data: { foo: 'bar' }, ... }
  await vc.delete({ path: 'secret/hello' });
});
```

### Docs

- HashiCorp's Vault [API docs](https://developer.hashicorp.com/vault/api-docs)

### Examples

##### Custom command implementation

```ts
import { generateCommand } from '@litehex/node-vault';
import { z } from 'zod';

const status = generateCommand({
  path: '/sys/seal-status',
  method: 'GET',
  client: vc,
  // refine: change the request before sending
  refine: (req) => {
    req.headers['X-Custom-Header'] = 'value';
    return req;
  },
  schema: {
    // path: use this to fill the path template
    // searchParams
    // body: schema for request body
    response: z.any()
  }
});

status().then((res) => {
  console.log(res);
});
```

##### Using a proxy or having the ability to modify the outgoing request.

```ts
import { Client } from '@litehex/node-vault';
import { ProxyAgent } from 'undici';

const agent = new ProxyAgent('http://localhost:8080');

const vc = new Client({
  // ... other params
  request: {
    dispatcher: agent,
    headers: {
      'X-Custom-Header': 'value'
    }
  }
});
```

### Credits

This project is inspired by [kr1sp1n/node-vault](https://github.com/kr1sp1n/node-vault), and thanks to the contributors for their efforts.

### License

This project is licensed under the GPLv3 License - see the [LICENSE](LICENSE) file for details
