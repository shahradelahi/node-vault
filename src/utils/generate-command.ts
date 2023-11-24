import type { CommandFn, RequestInit, RequestSchema } from '../typings';
import { request } from '../request';
import { ClientOptions } from '../index';
import { removeUndefined } from './object';
import mustache from 'mustache';

export type CommandInit<Schema extends RequestSchema> = {
  method: RequestInit['method'];
  path: string;
  schema: Schema;
  client: ClientOptions;
};

export function generateCommand<Schema extends RequestSchema>(
  init: CommandInit<Schema>
): CommandFn<Schema> {
  return (args, options = {}) => {
    const { method, path, client, schema } = init;

    const signedPath = mustache.render(path, args);
    const url = `${client.endpoint}/${client.apiVersion}${client.pathPrefix}${signedPath}`;

    const { headers: extraHeaders, ...restOpts } = options;

    const headers = removeUndefined({
      'X-Vault-Token': client.token,
      'X-Vault-Namespace': client.namespace,
      ...extraHeaders
    }) as RequestInit['headers'];

    return request(
      {
        ...restOpts,
        method,
        url,
        headers
      },
      schema
    );
  };
}
