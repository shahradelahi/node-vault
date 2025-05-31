import { execSync } from 'node:child_process';
import { accessSync } from 'node:fs';
import { resolve } from 'node:path';

import { Client } from '@/index';

const dcp = resolve('./tests/fixtures/docker-compose.yml');

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createInstance(unsealed: boolean = true): Promise<{
  vc: Client;
  keys: string[];
  root_token: string;
}> {
  launchVault();
  await sleep(5000);

  const vc = new Client();

  const { data, error } = await vc.init({
    secret_shares: 1,
    secret_threshold: 1
  });
  if (error) throw error;

  const { keys, root_token } = data;

  await sleep(1000);

  if (unsealed) {
    await vc.unseal({ key: keys[0]! });
    await sleep(2000);
  }

  return { vc, keys, root_token };
}

export function launchVault(): void {
  accessSync(dcp);

  execSync(`docker compose -f ${dcp} up -d --force-recreate`, {
    stdio: 'ignore'
  });
}

export function destroyInstance(): void {
  execSync(`docker compose -f ${dcp} down`, {
    stdio: 'ignore'
  });
}

export function prettyJson(data: object): string {
  return JSON.stringify(data, null, 2);
}
