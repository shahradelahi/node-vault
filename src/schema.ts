import { z } from 'zod';

export const AuthSchema = z.object({
  client_token: z.string(),
  policies: z.array(z.string()),
  metadata: z.any(),
  lease_duration: z.number(),
  renewable: z.boolean()
});

export const ClientOptionsSchema = z.object({
  endpoint: z.string().optional(),
  apiVersion: z.string().optional(),
  pathPrefix: z.string().optional(),
  token: z.string().optional(),
  namespace: z.string().optional()
});
