import { fetch } from 'undici';
import { setGlobalFetch } from 'zod-request';

setGlobalFetch(fetch);

// -------------------------------

export { Client } from '@/lib/client';
export { generateCommand } from '@/utils/generate-command';

// -------------------------------

export { VaultError } from '@/errors';

// -------------------------------

export type * from './typings';
