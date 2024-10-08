/* eslint-disable @typescript-eslint/ban-types */

import { SafeReturn } from 'p-safe';
import type { z } from 'zod';
import type { RequestSchema as ZodRequestSchema } from 'zod-request';

import { VaultError } from '@/errors';
import { ClientOptionsSchema } from '@/schema';

export type ClientOptions = z.infer<typeof ClientOptionsSchema> & {
  request?: Partial<RequestInit & Record<string, unknown>>;
  fetcher?: Fetcher;
};

export type RequestSchema = Omit<ZodRequestSchema, 'path' | 'body'> & {
  path?: z.ZodObject<any>;
  body?: z.ZodObject<any> | z.ZodAny;
};

export type Fetcher = (input: any, init: any) => Promise<any>;

export interface ExtendedRequestInit extends RequestInit, Record<string, unknown> {
  strictSchema?: boolean;
}

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
        ? {}
        : Schema['body'] extends z.ZodObject<any>
          ? z.infer<Schema['body']>
          : {});

export type CommandFn<Schema extends RequestSchema, RawResponse extends boolean = false> = (
  args?: CommandArgs<Schema>,
  options?: Omit<ExtendedRequestInit, 'url'>
) => Promise<
  SafeReturn<
    RawResponse extends true
      ? Response
      : Schema['response'] extends z.ZodType
        ? z.infer<Schema['response']>
        : unknown,
    VaultError
  >
>;
