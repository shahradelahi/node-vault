import { z } from 'zod';
import { CommandInit, generateCommand } from './utils/generate-command';
import { RequestSchema } from './typings';

const ClientOptionsSchema = z.object({
  endpoint: z.string().optional(),
  apiVersion: z.string().optional(),
  pathPrefix: z.string().optional(),
  token: z.string().optional(),
  namespace: z.string().optional()
});

export type ClientOptions = z.infer<typeof ClientOptionsSchema>;

export class Client {
  readonly endpoint: string;
  readonly apiVersion: string;
  readonly pathPrefix: string;
  readonly token: string | undefined;
  readonly namespace: string | undefined;

  constructor({ ...restOpts }: ClientOptions) {
    const options = ClientOptionsSchema.parse(restOpts);

    this.endpoint = options.endpoint || process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    this.apiVersion = options.apiVersion || 'v1';
    this.pathPrefix = options.pathPrefix || '';
    this.namespace = options.namespace || process.env.VAULT_NAMESPACE;
    this.token = options.token || process.env.VAULT_TOKEN;
  }

  private assignCommands<T extends RequestSchema>(commands: Record<string, CommandInit<T>>) {
    for (const [name, cmd] of Object.entries(commands)) {
      // @ts-ignore
      this[name] = this.generateFunction(cmd);
    }
  }

  readonly status = generateCommand({
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
}

export type * from './typings';
