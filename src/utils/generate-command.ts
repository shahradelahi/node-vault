import omit from 'lodash/omit';
import pick from 'lodash/pick';
import { SafeReturn, trySafe } from 'p-safe';
import { fetch, type RequestInit } from 'undici';
import { z } from 'zod';
import { generateRequest, ZodRequestInit, ZodResponse } from 'zod-request';

import { VaultError } from '@/errors';
import { CommandFn, CommandInit, RequestSchema } from '@/typings';

import { isJson } from './json';
import { removeUndefined } from './object';

export function generateCommand<Schema extends RequestSchema, RawResponse extends boolean = false>(
  init: CommandInit<Schema>,
  // @ts-expect-error Type 'RawResponse' is not assignable to type 'boolean'
  raw: RawResponse = false
): CommandFn<Schema, RawResponse> {
  return async (args, options = {}) => {
    return trySafe(async () => {
      const { method = 'GET', path, client, schema } = init;
      const { strictSchema = true, ...opts } = options;

      const { url: _url, input } = generateRequest(
        `${client.endpoint}/${client.apiVersion}${client.pathPrefix}${path}`,
        {
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
          schema
        } as ZodRequestInit<any, any>
      );

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
          return resolve(await response.json());
        }

        return resolve(parseText(await response.text()));
      }

      const zr = new ZodResponse(response, schema.response);

      if (hasJsonContentType) {
        return resolve(await zr.json());
      }

      return resolve(parseText(await zr.text()));
    });
  };
}

function resolve<T>(response: any): SafeReturn<T, VaultError> {
  // It's a Json error response
  if (typeof response === 'object' && 'errors' in response) {
    return { error: new VaultError(response.errors) };
  }

  return { data: response };
}

function parseText(text: string): object | string {
  const json = isJson(text);
  if (json) {
    return json;
  }
  return text;
}
