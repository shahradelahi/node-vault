import type * as z from 'zod';

import type { ClientOptionsSchema } from '@/schema';

export interface ClientOptions extends Infer<typeof ClientOptionsSchema> {
  request?: Partial<RequestInit & Record<string, unknown>>;
  fetcher?: Fetcher;
}

export interface RequestSchema {
  path?: z.ZodObject<any>;
  body?: z.ZodObject<any> | z.ZodRecord<any>;
  searchParams?: z.ZodObject<any>;
  headers?: z.ZodObject<any>;
  response?: z.ZodType<unknown>;
}

export interface Fetcher {
  (input: any, init: any): Promise<any>;
}

export interface CommandOptions extends Omit<RequestInit, 'url'>, Record<string, unknown> {
  strictSchema?: boolean;
}

interface RequestInitWithURL extends RequestInit {
  url: URL;
}

export interface CommandInit<Schema extends RequestSchema, RawResponse extends boolean = false> {
  method: RequestInit['method'];
  path: string;
  schema: Schema;
  client: ClientOptions;
  raw?: RawResponse;
  refine?: (init: RequestInitWithURL, args: CommandArgs<Schema>) => RequestInitWithURL;
  fetcher?: Fetcher;
}

export type CommandArgs<Schema extends RequestSchema> = Infer<Schema['path']> &
  Infer<Schema['searchParams']> &
  Infer<Schema['headers']> &
  Infer<Schema['body']> & { [key: string]: unknown };

export type Infer<T> = T extends z.ZodSchema ? z.infer<T> : T;
