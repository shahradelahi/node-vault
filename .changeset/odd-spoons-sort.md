---
"@litehex/node-vault": major
---

BREAKING: The responses of commands are wrapped in a record with type of `SafeReturn<T, VaultError>`. 

This record contains two properties:

- `data`: The `data` property for successful responses. The value depends on the command.
- `error`: The `error` property for error responses. The type is `VaultError`, which is a subclass of `Error`.

Read [Migration guide](https://github.com/shahradelahi/node-vault/wiki/Migration) for more details on how to use it.

