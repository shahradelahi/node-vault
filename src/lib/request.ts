import { fetch } from 'undici';
import type { RequestInit, RequestSchema, ValidatedResponse } from '../typings';
import { ApiResponseError } from './errors';
import pick from 'lodash.pick';

export async function request<Schema extends RequestSchema>(
  init: RequestInit,
  schema: Schema
): Promise<ValidatedResponse<Schema>> {
  // todo: add support for searchParams
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

  const json = await response.json();

  if (false !== strictSchema && schema.response) {
    const valid = schema.response.safeParse(json);
    if (!valid.success) {
      throw new ApiResponseError('Server response did not match client schema.', response);
    }
    return valid.data;
  }

  return json as unknown as ValidatedResponse<Schema>;
}
