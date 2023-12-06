import { ClientOptions, generateCommand } from '../index';
import { z } from 'zod';

export const kv2 = (opts: ClientOptions) => ({
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#configure-the-kv-engine
  config: generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/config',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      body: z.object({
        max_versions: z.number().optional(),
        cas_required: z.boolean().optional(),
        delete_version_after: z.string().optional()
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-kv-engine-configuration
  readConfig: generateCommand({
    method: 'GET',
    path: '/{{mountPath}}/config',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      response: z.object({
        data: z.object({
          cas_required: z.boolean(),
          delete_version_after: z.string(),
          max_versions: z.number()
        })
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-version
  read: generateCommand({
    method: 'GET',
    path: '/{{mountPath}}/data/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      searchParams: z.object({
        version: z.number().default(0).optional()
      }),
      response: z.object({
        data: z.object({
          data: z.record(z.string()),
          metadata: MetadataSchema
        })
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#create-update-secret
  write: generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/data/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      body: z.object({
        data: z.record(z.any()).default({}),
        options: PostOptionsSchema.default({}).optional()
      }),
      response: z.object({
        data: MetadataSchema
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#patch-secret
  patch: generateCommand({
    method: 'PATCH',
    path: '/{{mountPath}}/data/{{path}}',
    client: opts,
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
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-subkeys
  subKeys: generateCommand({
    method: 'GET',
    path: '/{{mountPath}}/metadata/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      searchParams: z.object({
        version: z.number().optional(),
        depth: z.number().optional()
      }),
      response: z.object({
        subkeys: z.any(),
        metadata: MetadataSchema
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#delete-latest-version-of-secret
  deleteLatestVersion: generateCommand({
    method: 'DELETE',
    path: '/{{mountPath}}/data/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#delete-secret-versions
  delete: generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/delete/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      body: z.object({
        versions: z.array(z.number())
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#undelete-secret-versions
  undelete: generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/undelete/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      body: z.object({
        versions: z.array(z.number())
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#destroy-secret-versions
  destroy: generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/destroy/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      body: z.object({
        versions: z.array(z.number())
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#list-secrets
  list: generateCommand({
    method: 'LIST',
    path: '/{{mountPath}}/metadata/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      response: z.object({
        keys: z.array(z.string())
      })
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#read-secret-metadata
  readMetadata: generateCommand({
    method: 'GET',
    path: '/{{mountPath}}/metadata/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      response: z.object({
        data: z.object({
          cas_required: z.boolean(),
          created_time: z.string(),
          current_version: z.number(),
          delete_version_after: z.string(),
          max_versions: z.number(),
          oldest_version: z.number(),
          updated_time: z.string(),
          custom_metadata: z.any().nullable(),
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
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#create-update-metadata
  writeMetadata: generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/metadata/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      body: MetadataRequestBodySchema
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#patch-metadata
  patchMetadata: generateCommand({
    method: 'PATCH',
    path: '/{{mountPath}}/metadata/{{path}}',
    client: opts,
    refine: (init) => {
      init.headers = {
        ...init.headers,
        'Content-Type': 'application/merge-patch+json'
      };
      return init;
    },
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      }),
      body: MetadataRequestBodySchema,
      response: z.any()
    }
  }),
  // https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#delete-metadata-and-all-versions
  deleteMetadata: generateCommand({
    method: 'DELETE',
    path: '/{{mountPath}}/metadata/{{path}}',
    client: opts,
    schema: {
      path: z.object({
        mountPath: z.string(),
        path: z.string()
      })
    }
  })
});

const MetadataSchema = z.object({
  created_time: z.string(),
  custom_metadata: z.any().nullable(),
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
