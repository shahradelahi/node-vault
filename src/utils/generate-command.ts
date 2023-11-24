import type { CommandArgs, CommandFn, RequestInit, RequestSchema } from '../typings';
import { request } from '../request';
import { ClientOptions } from '../index';
import { removeUndefined } from './object';
import mustache from 'mustache';
import pick from 'lodash.pick';
import { z } from 'zod';

export type CommandInit<Schema extends RequestSchema> = {
  method: RequestInit['method'];
  path: string;
  schema: Schema;
  client: ClientOptions;
  refine?: (init: RequestInit, args: CommandArgs<Schema>) => RequestInit;
};

export function generateCommand<Schema extends RequestSchema>(
  init: CommandInit<Schema>
): CommandFn<Schema> {
  return (args, options = {}) => {
    const { method, path, client, schema } = init;

    if (schema.path) {
      schema.path.parse(args);
    }

    const signedPath = mustache.render(path, args);
    let url = `${client.endpoint}/${client.apiVersion}${client.pathPrefix}${signedPath}`;

    // Replace unicode encodings.
    url = url.replace(/&#x2F;/g, '/');

    const { headers: extraHeaders, ...restOpts } = options;

    const headers = removeUndefined({
      'X-Vault-Token': client.token,
      'X-Vault-Namespace': client.namespace,
      ...extraHeaders
    }) as RequestInit['headers'];

    let requestInit: RequestInit = {
      ...restOpts,
      method,
      url,
      headers
    };

    if (schema.body && schema.body instanceof z.ZodObject) {
      requestInit.body = pick(args, Object.keys(schema.body.shape));
    }

    if (schema.body && schema.body instanceof z.ZodAny) {
      requestInit.body = args;
    }

    if (init.refine) {
      requestInit = init.refine(requestInit, (args as CommandArgs<Schema>) || {});
    }

    return request(requestInit, schema);
  };
}
