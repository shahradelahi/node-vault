---
"@litehex/node-vault": major
---

BREAKING: The responses are wrapped in a record of type `SafeReturn<T, VaultError>`. This record contains the `data` property for successful responses and the `error` property for error responses.

This change only affects the return value of commands. Here is an example of how to use it:

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

This feature is called Atomic Responses, which means there are only two responses: `success` and `error`.

Your editor/IDE might not detect any errors, so please make sure to update and verify correctness with every usage.
