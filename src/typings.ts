import { RequestInit as Init } from 'undici';
import { z } from 'zod';
import { JsonObject } from 'type-fest';

export interface RequestInit extends Omit<Init, 'body'> {
  url: string;
  strictSchema?: boolean;
  body?: Record<string, unknown>;
}

export interface RequestSchema {
  path?: z.ZodObject<any>;
  searchParams?: z.ZodObject<any>;
  body?: z.ZodObject<any> | z.ZodAny;
  response?: z.ZodObject<any> | z.ZodRecord<any> | z.ZodDiscriminatedUnion<any, any> | z.ZodAny;
}

export type ValidatedResponse<T extends RequestSchema> = T['response'] extends z.ZodAny
  ? any
  : T['response'] extends z.ZodRecord<any>
    ? JsonObject
    : T['response'] extends z.ZodObject<any>
      ? z.infer<T['response']>
      : T['response'] extends z.ZodDiscriminatedUnion<any, any>
        ? z.infer<T['response']>
        : unknown;

export type CommandArgs<Schema extends RequestSchema> =
  (Schema['searchParams'] extends z.ZodObject<any> ? z.infer<Schema['searchParams']> : {}) &
    (Schema['body'] extends z.ZodDiscriminatedUnion<any, any>
      ? z.infer<Schema['body']>
      : Schema['body'] extends z.ZodAny
        ? JsonObject
        : Schema['body'] extends z.ZodObject<any>
          ? z.infer<Schema['body']>
          : {}) &
    (Schema['path'] extends z.ZodObject<any> ? z.infer<Schema['path']> : {});

export type CommandFn<Schema extends RequestSchema> = (
  args?: CommandArgs<Schema>,
  options?: Omit<RequestInit, 'url'>
) => Promise<ValidatedResponse<Schema>>;
