import omit from 'lodash/omit';
import pick from 'lodash/pick';
import { trySafe, type SafeReturn } from 'p-safe';
import { z } from 'zod';
import {
  generateRequest,
  ZodResponse,
  type ZodRequestInit,
  type ZodValidationError
} from 'zod-request';

import { VaultError } from '@/errors';
import type { CommandFn, CommandInit, RequestSchema } from '@/typings';

import { isJson } from './json';
import { removeUndefined } from './object';

export function generateCommand<Schema extends RequestSchema, RawResponse extends boolean = false>(
  init: CommandInit<Schema>,
  // @ts-expect-error Type 'RawResponse' is not assignable to type 'boolean'
  raw: RawResponse = false
): CommandFn<Schema, RawResponse> {
  return async (args, options = {}) => {
    const { method = 'GET', path, client, schema } = init;
    const { strictSchema = true, ...opts } = options;

    const requestInit = {
      method,
      ...opts,
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
      headers: removeUndefined(
        Object.assign(
          {
            'X-Vault-Token': client.token,
            'X-Vault-Namespace': client.namespace
          },
          opts.headers || {}
        )
      ),
      schema: Object.assign(schema, {
        response: z.union([
          schema.response ?? z.any(),
          z.object({
            errors: z.array(z.string())
          })
        ])
      })
    } as ZodRequestInit<any, any>;

    const { url: _url, input } = generateRequest(
      `${client.endpoint}/${client.apiVersion}${client.pathPrefix}${path}`,
      requestInit
    );

    return trySafe(async () => {
      const fetcher = init.fetcher || client.fetcher || fetch;

      const rawInit = Object.assign(input as RequestInit, {
        url: new URL(
          _url
            .toString()
            // Replace unicode encodings.
            .replace(/&#x2F;/g, '/')
        )
      });

      const { url, ...refinedInput } = init.refine ? init.refine(rawInit, args as any) : rawInit;

      // Convert body to json if it's not already
      if (refinedInput.body && !isJson(refinedInput.body)) {
        refinedInput.body = JSON.stringify(refinedInput.body);
      }

      const response = await fetcher(url, refinedInput);
      if (raw !== false) {
        return { data: response };
      }

      const { headers } = response;

      const hasContent = headers.has('content-length') && headers.get('content-length') !== '0';
      if (!response.body && !hasContent) {
        return { data: response.ok };
      }

      const hasJsonContentType =
        headers.has('content-type') && headers.get('content-type') === 'application/json';

      if (!strictSchema || !schema.response || schema.response instanceof z.ZodAny) {
        if (hasJsonContentType) {
          return resolve(response, await response.json());
        }

        return resolve(response, parseText(await response.text()));
      }

      // From here it might throw a schema validation error
      try {
        const zr = new ZodResponse(response, schema.response);

        if (hasJsonContentType) {
          return resolve(response, await zr.json());
        }

        return resolve(response, parseText(await zr.text()));
      } catch (e) {
        if (e && e instanceof VaultError) return { error: e };

        if (e && typeof e === 'object' && e.constructor.name === 'ZodValidationError') {
          const error = new VaultError('Failed to validate response schema');
          error.cause = (e as unknown as ZodValidationError).flatten();
          return { error };
        }

        const error = new VaultError('Failed to parse response');
        error.cause = e;
        return { error };
      }
    });
  };
}

function resolve<T>(response: Response, data: any): SafeReturn<T, VaultError> {
  // It's a Json error response
  if (typeof data === 'object' && 'errors' in data) {
    const error = new VaultError(data.errors);
    error.cause = response;
    return { error };
  }

  return { data: data };
}

function parseText(text: string): object | string {
  const json = isJson(text);
  if (json) {
    return json;
  }
  return text;
}
