import type { SafeReturn } from 'p-safe';
import type * as z from 'zod';
import type { RequestSchema as ZodRequestSchema } from 'zod-request';

import type { VaultError } from '@/errors';
import type { ClientOptionsSchema } from '@/schema';

export interface ClientOptions extends z.infer<typeof ClientOptionsSchema> {
  request?: Partial<RequestInit & Record<string, unknown>>;
  fetcher?: Fetcher;
}

export interface RequestSchema extends Omit<ZodRequestSchema, 'path' | 'body'> {
  path?: z.ZodObject<any>;
  body?: z.ZodObject<any> | z.ZodAny;
}

export interface Fetcher {
  (input: any, init: any): Promise<any>;
}

export interface ExtendedRequestInit extends RequestInit, Record<string, unknown> {
  strictSchema?: boolean;
}

interface RequestInitWithURL extends RequestInit {
  url: URL;
}

export interface CommandInit<Schema extends RequestSchema> {
  method: RequestInit['method'];
  path: string;
  schema: Schema;
  client: ClientOptions;
  refine?: (init: RequestInitWithURL, args: CommandArgs<Schema>) => RequestInitWithURL;
  fetcher?: Fetcher;
}

export type CommandArgs<Schema extends RequestSchema> =
  // Path Schema
  Infer<Schema['path']> &
    // SearchParams Schema
    Infer<Schema['searchParams']> &
    // Headers Schema
    Infer<Schema['headers']> &
    // Body Schema
    Infer<Schema['body']>;

export interface CommandFn<Schema extends RequestSchema, RawResponse extends boolean = false> {
  (
    args?: CommandArgs<Schema>,
    options?: Omit<ExtendedRequestInit, 'url'>
  ): Promise<
    SafeReturn<RawResponse extends true ? Response : Infer<Schema['response']>, VaultError>
  >;
}

type Infer<T> = T extends z.ZodSchema ? z.infer<T> : { [K in keyof T]: T[K] };
