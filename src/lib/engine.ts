import { z } from 'zod';
import { RequestSchema } from '../typings';
import { AuthSchema } from '../schema';

export type Engine = Record<EngineAction, RequestSchema>;
export type EngineAction = 'read';

export const AnyEngineSchema = {
  path: z.object({
    path: z.string()
  }),
  response: z.any()
};

export type NoEngine = typeof AnyEngineSchema;

export const KV2Engine = {
  read: {
    path: z.object({
      path: z.string()
    }),
    searchParams: z.object({
      list: z.boolean(),
      version: z.number().optional()
    }),
    response: z.object({
      request_id: z.string(),
      lease_id: z.string().nullable(),
      renewable: z.boolean(),
      lease_duration: z.number(),
      data: z
        .object({
          data: z.record(z.string()),
          metadata: z.object({
            created_time: z.string(),
            custom_metadata: z.any().nullable(),
            deletion_time: z.string(),
            destroyed: z.boolean(),
            version: z.number()
          })
        })
        .nullable(),
      wrap_info: z.any().nullable(),
      warnings: z.array(z.string()).nullable(),
      auth: AuthSchema.nullable()
    })
  }
};

export const engines = <const>{
  kv2: KV2Engine
};

export type EngineName = keyof typeof engines;

export type EngineSchema<T extends EngineName> = (typeof engines)[T];
