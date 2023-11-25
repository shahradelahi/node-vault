import { z } from 'zod';
import { CommandInit, generateCommand } from './utils/generate-command';
import { RequestInit, RequestSchema } from './typings';
import { PartialDeep } from 'type-fest';

const ClientOptionsSchema = z.object({
  endpoint: z.string().optional(),
  apiVersion: z.string().optional(),
  pathPrefix: z.string().optional(),
  token: z.string().optional(),
  namespace: z.string().optional()
});

export type ClientOptions = z.infer<typeof ClientOptionsSchema> & {
  request?: PartialDeep<RequestInit>;
};

export class Client {
  endpoint: string;
  apiVersion: string;
  pathPrefix: string;
  namespace: string | undefined;
  token: string | undefined;
  request: PartialDeep<Omit<RequestInit, 'url'>> | undefined;

  constructor({ request, ...restOpts }: ClientOptions = {}) {
    const options = ClientOptionsSchema.parse(restOpts);

    this.endpoint = options.endpoint || process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    this.apiVersion = options.apiVersion || 'v1';
    this.pathPrefix = options.pathPrefix || '';
    this.namespace = options.namespace || process.env.VAULT_NAMESPACE;
    this.token = options.token || process.env.VAULT_TOKEN;

    this.request = request;
  }

  private assignCommands<T extends RequestSchema>(
    commands: Record<string, Omit<CommandInit<T>, 'client'>>
  ) {
    for (const [name, init] of Object.entries(commands)) {
      // @ts-ignore
      this[name] = generateCommand({ ...init, client: this });
    }
  }

  status = generateCommand({
    method: 'GET',
    path: '/sys/seal-status',
    client: this,
    schema: {
      response: z.object({
        sealed: z.boolean(),
        t: z.number(),
        n: z.number(),
        progress: z.number()
      })
    }
  });

  init = generateCommand({
    method: 'PUT',
    path: '/sys/init',
    client: this,
    schema: {
      body: z.object({
        secret_shares: z.number(),
        secret_threshold: z.number()
      }),
      response: z.object({
        keys: z.array(z.string()),
        keys_base64: z.array(z.string()),
        root_token: z.string()
      })
    }
  });

  read = generateCommand({
    method: 'GET',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      response: z.record(z.any())
    }
  });

  write = generateCommand({
    method: 'POST',
    path: '/{{path}}',
    client: this,
    refine: (init, params) => {
      console.log('refine', init, params);
      return init;
    },
    schema: {
      path: z.object({
        path: z.string()
      }),
      body: z.any(),
      response: z.record(z.any())
    }
  });

  delete = generateCommand({
    method: 'DELETE',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      response: z.record(z.any())
    }
  });
}

const AuthSchema = z.object({
  client_token: z.string(),
  policies: z.array(z.string()),
  metadata: z.any(),
  lease_duration: z.number(),
  renewable: z.boolean()
});

export type * from './typings';

export { generateCommand };
