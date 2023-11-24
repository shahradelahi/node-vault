import { RequestInit as Init } from 'undici';
import { z } from 'zod';

export interface RequestInit extends Init {
  url: string;
}

export interface RequestSchema {
  searchParams?: z.ZodObject<any>;
  body?: z.ZodObject<any>;
  response?: z.ZodObject<any>;
}

export type ValidatedResponse<T extends RequestSchema> = T['response'] extends z.ZodObject<any>
  ? z.infer<T['response']>
  : unknown;

export type CommandArgs<Schema extends RequestSchema> =
  (Schema['searchParams'] extends z.ZodObject<any> ? z.infer<Schema['searchParams']> : {}) &
    (Schema['body'] extends z.ZodObject<any> ? z.infer<Schema['body']> : {});

export type CommandFn<Schema extends RequestSchema> = (
  args?: CommandArgs<Schema>,
  options?: Init
) => Promise<ValidatedResponse<Schema>>;
