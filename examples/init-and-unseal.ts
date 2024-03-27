import { Client } from '@/lib/client';
import { execSync } from 'node:child_process';
import { sleep } from '@examples/utils';

execSync('docker compose up -d --force-recreate');
await sleep(5e3);

//////////

const vc = new Client();

// Init vault
const init = await vc.init({ secret_shares: 1, secret_threshold: 1 });
console.log(init); // { keys: [ ... ], keys_base64: [ ... ], ... }

// Set token
const { keys, root_token } = init;
vc.token = root_token;

const unsealed = await vc.unseal({ key: keys[0] });
console.log('unsealed', unsealed); // { type: 'shamir', initialized: true, sealed: false, ... }

//////////

// Down
execSync('docker compose down');
