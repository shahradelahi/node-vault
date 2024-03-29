import { z } from 'zod';

export const AuthSchema = z.object({
  client_token: z.string(),
  policies: z.array(z.string()),
  metadata: z.any(),
  lease_duration: z.number(),
  renewable: z.boolean()
});

export const EngineInfoSchema = z.object({
  accessor: z.string(),
  config: z.record(z.any()).nullable(),
  description: z.string(),
  external_entropy_access: z.boolean(),
  local: z.boolean(),
  options: z.record(z.any()).nullable(),
  plugin_version: z.string(),
  running_plugin_version: z.string(),
  running_sha256: z.string(),
  seal_wrap: z.boolean(),
  type: z.string(),
  uuid: z.string()
});

export const ErrorResponseSchema = z.object({
  errors: z.array(z.string())
});

export const SuccessResponseSchema = z.object({
  request_id: z.string(),
  lease_id: z.string(),
  renewable: z.boolean(),
  lease_duration: z.number(),
  wrap_info: z.record(z.any()).nullable(),
  warnings: z.record(z.any()).nullable(),
  auth: z.record(z.any()).nullable()
});

export const ApiResponseSchema = ErrorResponseSchema.or(z.record(z.any()));

export const ClientOptionsSchema = z.object({
  endpoint: z.string().optional(),
  apiVersion: z.string().optional(),
  pathPrefix: z.string().optional(),
  token: z.string().optional(),
  namespace: z.string().optional()
});
