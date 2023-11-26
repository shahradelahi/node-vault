import type { Response } from 'undici';
import { z } from 'zod';

export class ApiResponseError extends Error {
  readonly response: Response;

  constructor(message: string, response: Response) {
    message = `VaultError: ${message}`;
    super(message);
    this.response = response;
  }
}

export const ApiErrorSchema = z.object({
  errors: z.array(z.string())
});
