import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';

import { Client } from '@/index';

export interface VaultContainer {
  container: StartedTestContainer;
  client: Client;
  stop: () => Promise<void>;
}

export async function createVaultContainer(): Promise<VaultContainer> {
  const rootToken = 'root';
  const container = await new GenericContainer('hashicorp/vault:latest')
    .withExposedPorts(8200)
    .withEnvironment({
      VAULT_DEV_ROOT_TOKEN_ID: rootToken
    })
    .withWaitStrategy(Wait.forHttp('/v1/sys/health', 8200).forStatusCode(200))
    .start();

  const endpoint = `http://${container.getHost()}:${container.getMappedPort(8200)}`;
  const client = new Client({
    endpoint,
    token: rootToken
  });

  const stop = async () => {
    await container.stop();
  };

  return { container, client, stop };
}
