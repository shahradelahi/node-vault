/* eslint-disable @typescript-eslint/ban-types */

import type { z } from 'zod';
import { JsonObject, PartialDeep } from 'type-fest';
import type { ZodRequestInit, RequestSchema as ZodRequestSchema } from 'zod-request';
import type { RequestInit } from 'undici';
import { ClientOptionsSchema } from '@/schema';

export type ClientOptions = z.infer<typeof ClientOptionsSchema> & {
  request?: PartialDeep<RequestInit>;
  fetcher?: Fetcher;
};

export type RequestSchema = Omit<ZodRequestSchema, 'path' | 'body'> & {
  path?: z.ZodObject<any>;
  body?: z.ZodObject<any> | z.ZodAny;
};

export type Fetcher = (input: any, init: any) => Promise<any>;

export type ExtendedRequestInit = ZodRequestInit<any, any> & {
  strictSchema?: boolean;
};

type RequestInitWithURL = RequestInit & {
  url: URL;
};

export type CommandInit<Schema extends RequestSchema> = {
  method: RequestInit['method'];
  path: string;
  schema: Schema;
  client: ClientOptions;
  refine?: (init: RequestInitWithURL, args: CommandArgs<Schema>) => RequestInitWithURL;
  fetcher?: Fetcher;
};

export type CommandArgs<Schema extends RequestSchema> =
  // Path Schema
  (Schema['path'] extends z.ZodObject<any> ? z.infer<Schema['path']> : {}) &
    // SearchParams Schema
    (Schema['searchParams'] extends z.ZodObject<any> ? z.infer<Schema['searchParams']> : {}) &
    // Headers Schema
    (Schema['headers'] extends z.ZodObject<any> ? z.infer<Schema['headers']> : {}) &
    // Body Schema
    (Schema['body'] extends z.ZodDiscriminatedUnion<any, any>
      ? z.infer<Schema['body']>
      : Schema['body'] extends z.ZodAny
        ? JsonObject
        : Schema['body'] extends z.ZodObject<any>
          ? z.infer<Schema['body']>
          : {});

export type CommandFn<Schema extends RequestSchema> = (
  args?: CommandArgs<Schema>,
  options?: Omit<ExtendedRequestInit, 'url'>
) => Promise<Schema['response'] extends z.ZodType ? z.infer<Schema['response']> : unknown>;
