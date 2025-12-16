import { omit, pick, removeUndefined } from '@se-oss/object';
import { trySafe, type SafeReturn } from 'p-safe';
import * as z from 'zod';
import {
  generateRequest,
  ZodResponse,
  type ZodRequestInit,
  type ZodValidationError
} from 'zod-request';

import { VaultError } from '@/errors';
import type { CommandInit, CommandOptions, Infer, RequestSchema } from '@/typings';

import { isJson } from './json';

export function generateCommand<Schema extends RequestSchema, RawResponse extends boolean = false>(
  init: CommandInit<Schema, RawResponse>,
  raw: boolean = false
) {
  return async (
    args?: Infer<Schema['path']> &
      Infer<Schema['searchParams']> &
      Infer<Schema['headers']> &
      Infer<Schema['body']> & { [key: string]: unknown },
    options: CommandOptions = {}
  ): Promise<
    SafeReturn<RawResponse extends true ? Response : Infer<Schema['response']>, VaultError>
  > => {
    const { method = 'GET', path, client, schema } = init;
    const { strictSchema = true, ...opts } = options;

    const requestInit = {
      method,
      ...opts,
      path:
        schema?.path && typeof schema?.path === 'object'
          ? pick<any, any>(args || {}, Object.keys(schema.path.shape))
          : undefined,

      params:
        schema?.searchParams && typeof schema?.searchParams === 'object'
          ? pick<any, any>(args || {}, Object.keys(schema.searchParams.shape))
          : undefined,

      body: !schema?.body
        ? undefined
        : schema.body instanceof z.ZodObject
          ? pick<any, any>(args || {}, Object.keys(schema.body.shape))
          : (removeUndefined(
              omit<any, any>(
                args,
                // Potential Body Keys
                Object.keys(schema.searchParams?.shape || {})
                  .concat(Object.keys(schema.path?.shape || {}))
                  .concat(Object.keys(schema.headers?.shape || {}))
              )
            ) as any),

      headers: removeUndefined({
        'X-Vault-Token': client.token,
        'X-Vault-Namespace': client.namespace,
        ...(opts.headers || {})
      }),

      schema: strictSchema
        ? {
            ...schema,
            response: z.union([
              schema.response ?? z.any(),
              z.object({
                errors: z.array(z.string())
              })
            ])
          }
        : z.any()
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
      if (raw) {
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

  return { data };
}

function parseText(text: string): object | string {
  const json = isJson(text);
  if (json) {
    return json;
  }
  return text;
}
