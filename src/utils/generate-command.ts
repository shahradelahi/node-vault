import type { CommandArgs, CommandFn, RequestInit, RequestSchema } from '../typings';
import { request } from '../lib/request';
import { ClientOptions } from '../index';
import { removeUndefined } from './object';
import mustache from 'mustache';
import pick from 'lodash.pick';
import omit from 'lodash.omit';
import { z } from 'zod';
import { URLSearchParams } from 'node:url';

export type CommandInit<Schema extends RequestSchema> = {
  method: RequestInit['method'];
  path: string;
  schema: Schema;
  client: ClientOptions;
  refine?: (init: RequestInit, args: CommandArgs<Schema>) => RequestInit;
};

export async function generateRequestInit<Schema extends RequestSchema>(
  init: CommandInit<Schema>,
  args: CommandArgs<Schema>,
  options: Omit<RequestInit, 'url'>
): Promise<RequestInit> {
  const { method = 'GET', path, client, schema } = init;

  if (schema.path) {
    schema.path.parse(args);
  }

  const signedPath = mustache.render(path, args);
  const url = new URL(
    `${client.endpoint}/${client.apiVersion}${client.pathPrefix}${signedPath}`
      // Replace unicode encodings.
      .replace(/&#x2F;/g, '/')
  );

  const { headers: extraHeaders, ...restOpts } = options;

  const headers = removeUndefined({
    'X-Vault-Token': client.token,
    'X-Vault-Namespace': client.namespace,
    ...extraHeaders
  }) as RequestInit['headers'];

  if (schema.searchParams) {
    const items = removeUndefined(pick(args || {}, Object.keys(schema.searchParams.shape)));
    if (!schema.searchParams.safeParse(items).success) {
      throw new Error('ErrorSearchPrams: Invalid Args.');
    }

    for (const [key, val] of Object.entries(items)) {
      if (val === undefined || val === null) {
        console.warn(`Search param "${key}" is undefined or empty. Skipping...`);
        continue;
      }
      if (typeof val === 'boolean') {
        url.searchParams.set(key, val ? '1' : '0');
        continue;
      }
      url.searchParams.set(key, String(val));
    }
  }

  let requestInit: RequestInit = {
    ...restOpts,
    method,
    url: url.toString(),
    headers
  };

  if (schema.body && schema.body instanceof z.ZodObject) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      throw new Error('Request with GET/HEAD/OPTIONS method cannot have body.');
    }

    // if (schema.body instanceof z.ZodAny) {
    //   requestInit.body = removeUndefined(omit(args, Object.keys(schema.searchParams?.shape || {})));
    // }

    // if (schema.body instanceof z.ZodObject) {
    //   const items = removeUndefined(pick(args || {}, Object.keys(schema.body.shape)));
    //   if (!schema.body.safeParse(items).success) {
    //     throw new Error('ErrorBody: Invalid Args.');
    //   }
    //   requestInit.body = items;
    // }

    const items = removeUndefined(pick(args || {}, Object.keys(schema.body.shape)));
    if (!schema.body.safeParse(items).success) {
      throw new Error('ErrorBody: Invalid Args.');
    }
    requestInit.body = items;
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && schema.body instanceof z.ZodAny) {
    // Removes path and search params from body.
    const keysToOmit = Object.keys(schema.searchParams?.shape || {}).concat(
      Object.keys(schema.path?.shape || {})
    );

    requestInit.body = removeUndefined(omit(args, keysToOmit));
  }

  if (init.refine) {
    requestInit = init.refine(requestInit, args);
  }

  return requestInit;
}

export function generateCommand<Schema extends RequestSchema>(
  init: CommandInit<Schema>
): CommandFn<Schema> {
  return async (args, options = {}) => {
    const requestInit = await generateRequestInit(init, args || {}, options);
    return request(requestInit, init.schema);
  };
}
