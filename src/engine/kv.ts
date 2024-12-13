import * as z from 'zod';

import { ApiSector } from '@/lib/sector';
import { SuccessResponseSchema, ZodAnyRecord } from '@/schema';
import { generateCommand } from '@/utils/generate-command';

/**
 * KV secrets engine - version 1
 *
 * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v1
 */
export class Kv extends ApiSector {
  /**
   * Read secret
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v1#read-secret
   */
  get read() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        response: SuccessResponseSchema.extend({
          data: ZodAnyRecord
        })
      }
    });
  }

  /**
   * List secrets
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v1#list-secrets
   */
  get list() {
    return generateCommand({
      method: 'LIST',
      path: '/{{mountPath}}/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        response: SuccessResponseSchema.extend({
          data: z.object({
            keys: z.array(z.string())
          })
        })
      }
    });
  }

  /**
   * Create/Update secret
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v1#create-update-secret
   */
  get write() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/{{path}}',
      client: this.client,
      schema: {
        // Parameters
        //
        //     path (string: <required>) – Specifies the path of the secrets to create/update. This is specified as part of the URL.
        //     :key (string: "") – Specifies a key in the payload, paired with an associated value, to be held at the given location. Multiple key/value pairs can be specified, and all will be returned on a read operation. A key called ttl will trigger some special behavior. See the Vault KV secrets engine documentation for details.
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: z.object({
          data: ZodAnyRecord
        }),
        response: z.boolean()
      },
      refine: (init) => {
        // Flat the body.data
        init.body = init.body ? (init.body as any).data || {} : {};
        return init;
      }
    });
  }

  /**
   * Delete secret
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v1#delete-secret
   */
  get delete() {
    return generateCommand({
      method: 'DELETE',
      path: '/{{mountPath}}/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Engine info
   */
  get info() {
    return generateCommand({
      method: 'GET',
      path: '/sys/mounts/{{mountPath}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string()
        }),
        response: SuccessResponseSchema.extend({
          deprecation_status: z.string(),
          type: z.string(),
          description: z.string(),
          seal_wrap: z.boolean(),
          options: ZodAnyRecord,
          running_plugin_version: z.string(),
          running_sha256: z.string(),
          config: z.object({
            default_lease_ttl: z.number(),
            force_no_cache: z.boolean(),
            max_lease_ttl: z.number()
          }),
          accessor: z.string(),
          local: z.boolean(),
          external_entropy_access: z.boolean(),
          uuid: z.string(),
          plugin_version: z.string(),
          data: z.object({
            accessor: z.string(),
            config: z.object({
              default_lease_ttl: z.number(),
              force_no_cache: z.boolean(),
              max_lease_ttl: z.number()
            }),
            deprecation_status: z.string(),
            description: z.string(),
            external_entropy_access: z.boolean(),
            local: z.boolean(),
            options: ZodAnyRecord,
            plugin_version: z.string(),
            running_plugin_version: z.string(),
            running_sha256: z.string(),
            seal_wrap: z.boolean(),
            type: z.string(),
            uuid: z.string()
          })
        })
      }
    });
  }
}
