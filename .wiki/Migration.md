## Migration to v1

### Responses of commands

The responses of commands are wrapped in a record with type of `SafeReturn<T, VaultError>`.

This record contains two properties:

- `data`: The `data` property for successful responses. The value depends on the command.
- `error`: The `error` property for error responses. The type is `VaultError`, which is a subclass of `Error`.

Your editor/IDE might not detect any errors, so please make sure to update and verify correctness of every usage.

###### Example

```typescript
import { VaultError, Client } from '@litehex/node-vault';

const { data, error } = await vc.write({
  path: 'secret/test',
  data: {
    foo: 'bar'
  }
});

if (error) {
  if (error instanceof VaultError) {
    return console.log(`Panic Mode: ${error.message}`);
  }
  return console.log(error); // Probably fetch failed. Should we retry?
}

// The error is checked by the last statement above and the only possibility is the success response with the `data` property

console.log(error); // undefined
console.log(data); // { request_id: '...', lease_id: '...', ... }
```
