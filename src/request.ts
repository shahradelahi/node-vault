import { fetch } from 'undici';
import type { RequestInit, RequestSchema, ValidatedResponse } from './typings';

export async function request<Schema extends RequestSchema>(
  init: RequestInit,
  schema: Schema
): Promise<ValidatedResponse<Schema>> {
  if (schema.searchParams) {
    const valid = schema.searchParams.safeParse(init.url);
    if (!valid.success) {
      throw new Error(valid.error.message);
    }
  }

  if (schema.body) {
    const valid = schema.body.safeParse(init.body);
    if (!valid.success) {
      throw new Error(valid.error.message);
    }
  }

  const response = await fetch(init.url, init);
  const json = await response.json();

  if (schema.response) {
    const valid = schema.response.safeParse(json);
    if (!valid.success) {
      throw new Error(valid.error.message);
    }
    return valid.data;
  }

  return json as unknown as ValidatedResponse<Schema>;
}
