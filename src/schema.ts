import { z } from 'zod';

export const AuthSchema = z.object({
  client_token: z.string(),
  policies: z.array(z.string()),
  metadata: z.any(),
  lease_duration: z.number(),
  renewable: z.boolean()
});
