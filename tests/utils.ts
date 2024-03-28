import { execSync } from 'node:child_process';
import { Client } from '@litehex/node-vault';

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createInstance(unsealed: boolean = true): Promise<{
  vc: Client;
  keys: string[];
  root_token: string;
}> {
  execSync('docker compose up -d --force-recreate', {
    stdio: 'ignore'
  });
  await sleep(1e3);

  const vc = new Client();

  const { keys, root_token } = await vc.init({
    secret_shares: 1,
    secret_threshold: 1
  });

  await sleep(1e3);

  if (unsealed) {
    await vc.unseal({
      key: keys[0]
    });
    await sleep(1e3);
  }

  return { vc, keys, root_token };
}

export function destroyInstance(): void {
  execSync('docker compose down', {
    stdio: 'ignore'
  });
}

export function prettyJson(data: object): string {
  return JSON.stringify(data, null, 2);
}
