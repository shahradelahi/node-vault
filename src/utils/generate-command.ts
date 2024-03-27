import { CommandFn, CommandInit, RequestSchema } from '@/typings';
import pick from 'lodash.pick';
import { generateRequest, ZodResponse } from 'zod-request';
import omit from 'lodash.omit';
import { z } from 'zod';
import { removeUndefined } from './object';
import { isJson } from './is-json';

export function generateCommand<Schema extends RequestSchema>(
  init: CommandInit<Schema>
): CommandFn<Schema> {
  return async (args, options = {}) => {
    const { method = 'GET', path, client, schema } = init;

    const { url: _url, input } = generateRequest<any, any>(
      `${client.endpoint}/${client.apiVersion}${client.pathPrefix}${path}`,
      {
        method,
        ...(options || {}),
        path: !schema?.path ? undefined : pick(args || {}, Object.keys(schema.path.shape)),
        params: !schema?.searchParams
          ? undefined
          : pick(args || {}, Object.keys(schema.searchParams.shape)),
        body: !schema?.body
          ? undefined
          : schema.body instanceof z.ZodObject
            ? pick(args || {}, Object.keys(schema.body.shape))
            : (removeUndefined(
                omit(
                  args,
                  // Potential Body Keys
                  Object.keys(schema.searchParams?.shape || {})
                    .concat(Object.keys(schema.path?.shape || {}))
                    .concat(Object.keys(schema.headers?.shape || {}))
                )
              ) as any),
        headers: {
          'X-Vault-Token': client.token,
          'X-Vault-Namespace': client.namespace,
          ...(options.headers || {})
        },
        schema
      }
    );

    const fetcher = init.fetcher || client.fetcher || globalThis.fetch;

    const url = _url
      .toString()
      // Replace unicode encodings.
      .replace(/&#x2F;/g, '/');
    const refinedInput = init.refine ? init.refine(input, args as any) : input;

    // Convert body to json if it's not already
    if (refinedInput.body && !isJson(refinedInput.body)) {
      refinedInput.body = JSON.stringify(refinedInput.body);
    }

    const response = await fetcher(url, refinedInput);

    if (!schema.response || schema.response instanceof z.ZodAny) {
      if (
        response.headers.has('content-length') &&
        response.headers.get('content-length') !== '0'
      ) {
        if (
          response.headers.has('content-type') &&
          response.headers.get('content-type')?.includes('application/json')
        ) {
          return response.json();
        }

        return response.text();
      }

      return response.ok;
    }

    if (!options.strictSchema) {
      return response.json();
    }

    return new ZodResponse(response, schema.response).json();
  };
}
