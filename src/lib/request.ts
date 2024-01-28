import { fetch } from 'undici';
import type { RequestInit, RequestSchema, ValidatedResponse } from '../typings';
import { ApiResponseError } from './errors';
import pick from 'lodash.pick';
import { json } from 'node:stream/consumers';
import { isJson } from '../utils/is-json';

export async function request<Schema extends RequestSchema>(
  init: RequestInit,
  schema: Schema
): Promise<ValidatedResponse<Schema>> {
  // todo: add support for searchParams, note searchParams are handled by generateRequestInit function for now
  // if (schema.searchParams) {
  //   const params = new URL(init.url).searchParams;
  //   const picked = pick(params, Object.keys(schema.searchParams.shape));
  //   const valid = schema.searchParams.safeParse(init.url);
  //   if (!valid.success) {
  //     throw new Error('ErrorSearchPrams: Invalid Args. ' + valid.error.message);
  //   }
  // }

  if (schema.body) {
    const valid = schema.body.safeParse(init.body);
    if (!valid.success) {
      throw new Error('ErrorBody: Invalid Args. ' + valid.error.message);
    }
  }

  let body: string | undefined = undefined;
  if (init.body) {
    body = JSON.stringify(init.body);
  }

  const { url, strictSchema, ...restInit } = init;
  const response = await fetch(url, {
    ...restInit,
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiResponseError(`${response.statusText}\n${text}`, response);
  }

  // Check is there a body in response
  if (response.headers.get('content-length') === '0') {
    return {} as ValidatedResponse<Schema>;
  }

  const raw = await response.text();
  if (raw === '') {
    return {} as ValidatedResponse<Schema>;
  }

  // If response was json, parse it and validate
  if (response.headers.get('content-type')?.includes('application/json')) {
    if (!isJson(raw)) {
      throw new ApiResponseError('Server response was not valid JSON.', response);
    }
    const json = JSON.parse(raw);

    if (false !== strictSchema && schema.response) {
      const valid = schema.response.safeParse(json);
      if (!valid.success) {
        throw new ApiResponseError('Server response did not match client schema.', response);
      }
      return valid.data;
    }

    return json as unknown as ValidatedResponse<Schema>;
  }

  // Otherwise, return the raw text
  return raw as unknown as ValidatedResponse<Schema>;
}
