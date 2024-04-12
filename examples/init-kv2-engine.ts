import { createInstance } from '@examples/client';

const vc = await createInstance({ unsealed: true });

const mountPath = 'my-secret';
const path = 'hello';

await vc.mount({
  mountPath: 'my-secret',
  type: 'kv-v2'
});

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
