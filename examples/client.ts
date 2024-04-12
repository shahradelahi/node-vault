import { sleep } from '@examples/utils';
import { Client } from '@litehex/node-vault';
import { execSync } from 'node:child_process';

const vc = new Client({
  endpoint: process.env.VAULT_ENDPOINT_URL,
  token: process.env.VAULT_TOKEN
});

type CreateInstanceOpts = {
  unsealed: boolean;
};

export async function createInstance(opts: CreateInstanceOpts) {
  execSync('docker compose up -d --force-recreate');
  await sleep(5e3);

  const { root_token, keys } = await vc.init({ secret_shares: 1, secret_threshold: 1 });
  vc.token = root_token;

  if (opts.unsealed) {
    await vc.unseal({ key: keys[0] });
  }

  return vc;
}

function handleExit() {
  execSync('docker compose down || true');
}

process.on('exit', handleExit);
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

export { vc };
