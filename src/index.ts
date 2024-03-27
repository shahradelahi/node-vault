import { setGlobalFetch } from 'zod-request';
import { fetch } from 'undici';

setGlobalFetch(fetch);

// -------------------------------

export { Client } from '@/lib/client';
export { generateCommand } from '@/utils/generate-command';

// -------------------------------

export type * from './typings';
