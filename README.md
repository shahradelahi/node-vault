# node-vault

> A modern JavaScript client for HashiCorp's Vault with a focus on ease-of-use.

[![Build status](https://github.com/shahradelahi/node-vault/actions/workflows/ci.yml/badge.svg)](https://github.com/shahradelahi/node-vault/actions/workflows/ci.yml)
[![Dependency Status](https://img.shields.io/librariesio/release/npm/@litehex%2Fnode-vault.svg)](https://libraries.io/npm/@litehex%2Fnode-vault/)
[![npm](https://img.shields.io/npm/v/@litehex/node-vault)](https://www.npmjs.com/package/@litehex/node-vault)
[![install size](https://packagephobia.com/badge?p=@litehex/node-vault)](https://packagephobia.com/result?p=@litehex/node-vault)
[![GPL-3.0 Licensed](https://img.shields.io/badge/License-GPL3.0-blue.svg?style=flat)](https://opensource.org/licenses/GPL-3.0)

### Notable features

- Mostly type-safe
- Highly extendable and configurable

### 📦 Installation

```bash
npm install @litehex/node-vault
```

### 📖 Usage

##### Init and unseal vault

```typescript
import { Client } from '@litehex/node-vault';

// Get a new instance of the client
const vc = new Client({
  apiVersion: 'v1', // default
  endpoint: 'http://127.0.0.1:8200', // default
  token: 'hv.xxxxxxxxxxxxxxxxxxxxx' // Optional in case you want to initialize the vault
});

// Init vault
const init = await vc.init({ secret_shares: 1, secret_threshold: 1 });
console.log(init); // { keys: [ ... ], keys_base64: [ ... ], ... }

// Set token
const { keys, root_token } = init;
vc.token = root_token;

const unsealed = await vc.unseal({ key: keys[0] });

console.log(unsealed); // { type: 'shamir', initialized: true, sealed: false, ... }
```

##### Create Key/Value V2 engine

```typescript
const mounted = await vc.mount({
  mountPath: 'my-secret',
  type: 'kv-v2'
});

console.log(mounted); // true

const info = await vc.engineInfo({ mountPath: 'my-secret' });

console.log(info); // { type: 'kv', options: { version: '2' }, ... }
```

##### Write, read and delete secrets

```typescript
const mountPath = 'my-secret';
const path = 'hello';

const write = await vc.kv2.write({
  mountPath,
  path,
  data: { foo: 'bar' }
});
console.log(write); // { request_id: '...', lease_id: '...', ... }

const read = await vc.kv2.read({ mountPath, path });
console.log(read); // { request_id: '...', lease_id: '...', ... }

const deleted = await vc.kv2.deleteLatest({ mountPath, path });
console.log(deleted); // true
```

Check out the [examples](/examples) and [tests](/tests) directory for more examples.

### 📚 Documentation

For all configuration options, please see [the API docs](https://paka.dev/npm/@litehex/node-vault).

### 🤝 Contributing

You can contribute to this project by opening an issue or a pull request
on [GitHub](https://github.com/shahradelahi/node-vault). Feel free to contribute, we care about your ideas and
suggestions.

### Relevant

- HashiCorp's Vault [API docs](https://developer.hashicorp.com/vault/api-docs)
- [Minimal CLI for K/V V2 engine](https://github.com/shahradelahi/vault-cli)

### License

[GPL-3.0](LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi)
