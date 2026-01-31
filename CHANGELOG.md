# @litehex/node-vault

## 1.1.4

### Patch Changes

- 0030a98: chore: update dependencies

## 1.1.3

### Patch Changes

- 77b9aa6: fix(client): restore schema mutation for proper error response handling

## 1.1.2

### Patch Changes

- edb24e7: refactor: Replace `lodash-es` with `@se-oss/object`

## 1.1.1

### Patch Changes

- 210f155: refactor(client): Improve generateCommand header and schema handling

## 1.1.0

### Minor Changes

- ca8e7f0: feat: Add complete Transit Secrets Engine support with full API coverage
- f5160ec: Node.js 18 reached End-of-Life on April 30, 2025, and this project no longer supports it.

## 1.0.4

### Patch Changes

- ef1b231: fix: update kv engine schemas with `v1.19.x` api spec

## 1.0.3

### Patch Changes

- ad48a22: Replaced lodash-es and its type definitions to resolve missing module imports and reduce bundle size.

## 1.0.2

### Patch Changes

- 8c9d184: fix: optimize types that significantly reduce bundle size (around 54%).

## 1.0.1

### Patch Changes

- 907a84d: fix: improve error handling

## 1.0.0

### Major Changes

- 3775bf3: Fix: Using the environment's global `fetch` API instead of `undici`.

  This change makes this library more compatible with JavaScript runtimes that do not support `Node.js` modules. If you want to use `undici` again, use the [Custom Fetcher](https://github.com/shahradelahi/node-vault/wiki/Usage#custom-fetcher) feature.

- f922ba9: BREAKING: The responses of commands are wrapped in a record with type of `SafeReturn<T, VaultError>`.

  This record contains two properties:
  - `data`: The `data` property for successful responses. The value depends on the command.
  - `error`: The `error` property for error responses. The type is `VaultError`, which is a subclass of `Error`.

  Read [Migration guide](https://github.com/shahradelahi/node-vault/wiki/Migration) for more details on how to use it.

- e2f73e7: Fix: Switched license from `GPL-3.0` to `MIT`, to make the project more open and permissive.

## 0.2.5

### Patch Changes

- 9f41e99: fix: the `fetcher` parameter was not being assigned to the client

## 0.2.4

### Patch Changes

- 2a24739: fix: type issues with default `write` command
- 3bb7c15: fix: the bug where the args for `aws.stsCredentials` were not being sent

## 0.2.3

### Patch Changes

- 90d185e: feat: Capability to generate AWS credentials for STS path
