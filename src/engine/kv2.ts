import { generateCommand } from '@/index';
import { ApiSector } from '@/lib/sector';
import { SuccessResponseSchema, ZodAnyRecord } from '@/schema';
import { z } from 'zod';

export class Kv2 extends ApiSector {
  /**
   * Configure the KV engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#configure-the-kv-engine
   */
  get config() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/config',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string()
        }),
        body: z.object({
          max_versions: z.number().optional(),
          cas_required: z.boolean().optional(),
          delete_version_after: z.string().optional()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Read KV engine configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-kv-engine-configuration
   */
  get readConfig() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/config',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string()
        }),
        response: SuccessResponseSchema.extend({
          data: z.object({
            cas_required: z.boolean(),
            delete_version_after: z.string(),
            max_versions: z.number()
          })
        })
      }
    });
  }

  /**
   * Read secret version
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-version
   */
  get read() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/data/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        searchParams: z.object({
          version: z.number().default(0).optional()
        }),
        response: SuccessResponseSchema.extend({
          data: z.object({
            data: z.record(z.string()),
            metadata: MetadataSchema
          })
        })
      }
    });
  }

  /**
   * Create/Update secret
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#create-update-secret
   */
  get write() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/data/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: z.object({
          data: z.record(z.any()).default({}),
          options: PostOptionsSchema.default({}).optional()
        }),
        response: SuccessResponseSchema.extend({
          data: MetadataSchema
        })
      }
    });
  }

  /**
   * Patch secret
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#patch-secret
   */
  get patch() {
    return generateCommand({
      method: 'PATCH',
      path: '/{{mountPath}}/data/{{path}}',
      client: this.client,
      refine: (init) => {
        init.headers = Object.assign(init.headers || {}, {
          'Content-Type': 'application/merge-patch+json'
        });
        return init;
      },
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: z.object({
          data: z.any(),
          options: PostOptionsSchema
        }),
        response: z.object({
          data: MetadataSchema
        })
      }
    });
  }

  /**
   * Read secret subkeys
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-subkeys
   */
  get subKeys() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/subkeys/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        searchParams: z.object({
          version: z.number().optional(),
          depth: z.number().optional()
        }),
        response: SuccessResponseSchema.extend({
          data: z.object({
            metadata: MetadataSchema,
            subkeys: z.record(z.any())
          })
        })
      }
    });
  }

  /**
   * Delete latest version of secret
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#delete-latest-version-of-secret
   */
  get deleteLatest() {
    return generateCommand({
      method: 'DELETE',
      path: '/{{mountPath}}/data/{{path}}',
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
   * Delete secret versions
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#delete-secret-versions
   */
  get delete() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/delete/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: z.object({
          versions: z.array(z.number())
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Undelete secret versions
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#undelete-secret-versions
   */
  get undelete() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/undelete/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: z.object({
          versions: z.array(z.number())
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Destroy secret versions
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#destroy-secret-versions
   */
  get destroy() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/destroy/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: z.object({
          versions: z.array(z.number())
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * List secrets
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#list-secrets
   */
  get list() {
    return generateCommand({
      method: 'LIST',
      path: '/{{mountPath}}/metadata/{{path}}',
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
   * Read secret metadata
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-metadata
   */
  get readMetadata() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/metadata/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        response: SuccessResponseSchema.extend({
          data: z.object({
            cas_required: z.boolean(),
            created_time: z.string(),
            current_version: z.number(),
            custom_metadata: z.record(z.string()).nullable(),
            delete_version_after: z.string(),
            max_versions: z.number(),
            oldest_version: z.number(),
            updated_time: z.string(),
            versions: z.record(
              z.object({
                created_time: z.string(),
                deletion_time: z.string(),
                destroyed: z.boolean()
              })
            )
          })
        })
      }
    });
  }

  /**
   * Create/Update metadata
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#create-update-metadata
   */
  get writeMetadata() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/metadata/{{path}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: MetadataRequestBodySchema,
        response: z.boolean()
      }
    });
  }

  /**
   * Patch metadata
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#patch-metadata
   */
  get patchMetadata() {
    return generateCommand({
      method: 'PATCH',
      path: '/{{mountPath}}/metadata/{{path}}',
      client: this.client,
      refine: (init) => {
        init.headers = Object.assign(init.headers || {}, {
          'Content-Type': 'application/merge-patch+json'
        });
        return init;
      },
      schema: {
        path: z.object({
          mountPath: z.string(),
          path: z.string()
        }),
        body: MetadataRequestBodySchema,
        response: z.boolean()
      }
    });
  }

  /**
   * Delete metadata and all versions
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#delete-metadata-and-all-versions
   */
  get deleteMetadata() {
    return generateCommand({
      method: 'DELETE',
      path: '/{{mountPath}}/metadata/{{path}}',
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
          local: z.boolean(),
          seal_wrap: z.boolean(),
          external_entropy_access: z.boolean(),
          options: ZodAnyRecord,
          running_sha256: z.string(),
          deprecation_status: z.string(),
          config: z.object({
            default_lease_ttl: z.number(),
            force_no_cache: z.boolean(),
            max_lease_ttl: z.number()
          }),
          type: z.string(),
          description: z.string(),
          accessor: z.string(),
          uuid: z.string(),
          plugin_version: z.string(),
          running_plugin_version: z.string(),
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

const MetadataSchema = z.object({
  created_time: z.string(),
  custom_metadata: z.record(z.string()).nullable(),
  deletion_time: z.string(),
  destroyed: z.boolean(),
  version: z.number()
});

const MetadataRequestBodySchema = z.object({
  max_versions: z.number().optional(),
  cas_required: z.boolean().optional(),
  delete_version_after: z.string().optional(),
  custom_metadata: z.record(z.string()).nullable().optional()
});

const PostOptionsSchema = z.object({
  cas: z.number().default(0),
  check_and_set: z.string().optional(),
  max_versions: z.number().optional(),
  prelease: z.number().optional(),
  version: z.number().optional()
});
