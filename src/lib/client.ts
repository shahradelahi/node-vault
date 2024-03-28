import { PartialDeep } from 'type-fest';
import { ApiResponseSchema, ClientOptionsSchema, EngineInfoSchema, ErrorSchema } from '@/schema';
import { generateCommand } from '@litehex/node-vault';
import { z } from 'zod';
import { kv2 } from '@/engine/kv2';
import { ClientOptions } from '@/typings';
import type { RequestInit } from 'undici';

class Client {
  endpoint: string;
  apiVersion: string;
  pathPrefix: string;
  namespace: string | undefined;
  token: string | undefined;
  request: PartialDeep<Omit<RequestInit, 'url'>> | undefined;

  constructor(opts: ClientOptions = {}) {
    const { request, ...restOpts } = opts;
    const options = ClientOptionsSchema.parse(restOpts);

    this.endpoint = options.endpoint || process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    this.apiVersion = options.apiVersion || 'v1';
    this.pathPrefix = options.pathPrefix || '';
    this.namespace = options.namespace || process.env.VAULT_NAMESPACE;
    this.token = options.token || process.env.VAULT_TOKEN;

    this.request = request;
  }

  kv2() {
    return kv2(this);
  }

  config = generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/config',
    client: this,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      body: z.any(),
      response: z.any()
    }
  });

  read = generateCommand({
    method: 'GET',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      response: z.union([ErrorSchema, z.record(z.any())])
    }
  });

  write = generateCommand({
    method: 'POST',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      body: z.any(),
      response: z.union([ErrorSchema, z.record(z.any()), z.boolean()])
    }
  });

  delete = generateCommand({
    method: 'DELETE',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      response: z.union([ErrorSchema, z.boolean()])
    }
  });

  /**
   * Seal status
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/seal-status#seal-status
   */
  status = generateCommand({
    method: 'GET',
    path: '/sys/seal-status',
    client: this,
    schema: {
      response: z.union([
        ErrorSchema,
        z.object({
          type: z.string(),
          initialized: z.boolean(),
          sealed: z.boolean(),
          t: z.number(),
          n: z.number(),
          progress: z.number(),
          nonce: z.string(),
          version: z.string(),
          build_date: z.string(),
          migration: z.boolean(),
          recovery_seal: z.boolean(),
          storage_type: z.string()
        })
      ])
    }
  });

  /**
   * Read initialization status
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/init#read-initialization-status
   */
  initialized = generateCommand({
    method: 'GET',
    path: '/sys/init',
    client: this,
    schema: {
      response: z.object({
        initialized: z.boolean()
      })
    }
  });

  /**
   * Start initialization
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/init#start-initialization
   */
  init = generateCommand({
    method: 'POST',
    path: '/sys/init',
    client: this,
    schema: {
      body: z.object({
        pgp_keys: z.array(z.string()).optional(),
        root_token_pgp_key: z.string().default('').optional(),
        secret_shares: z.number(),
        secret_threshold: z.number(),
        stored_shares: z.number().optional(),
        recovery_shares: z.number().default(0).optional(),
        recovery_threshold: z.number().default(0).optional(),
        recovery_pgp_keys: z.array(z.string()).optional()
      }),
      response: z.object({
        keys: z.array(z.string()),
        keys_base64: z.array(z.string()),
        root_token: z.string()
      })
    }
  });

  /**
   * Submit unseal key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/unseal#submit-unseal-key
   */
  unseal = generateCommand({
    method: 'POST',
    path: '/sys/unseal',
    client: this,
    schema: {
      body: z.object({
        key: z.string(),
        reset: z.boolean().default(false).optional(),
        migrate: z.boolean().default(false).optional()
      }),
      response: z.union([
        ErrorSchema,
        z.discriminatedUnion('sealed', [
          z.object({
            sealed: z.literal(true),
            t: z.number(),
            n: z.number(),
            progress: z.number(),
            version: z.string()
          }),
          z.object({
            sealed: z.literal(false),
            t: z.number(),
            n: z.number(),
            progress: z.number(),
            version: z.string(),
            cluster_name: z.string(),
            cluster_id: z.string()
          })
        ])
      ])
    }
  });

  /**
   * Seal
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/seal#seal
   */
  seal = generateCommand({
    method: 'POST',
    path: '/sys/seal',
    client: this,
    schema: {
      response: z.union([ErrorSchema, z.boolean()])
    }
  });

  /**
   * Read root generation progress
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#read-root-generation-progress
   */
  getRootGenerationProgress = generateCommand({
    method: 'GET',
    path: '/sys/generate-root/attempt',
    client: this,
    schema: {
      response: z.object({
        started: z.boolean(),
        nonce: z.string(),
        progress: z.number(),
        required: z.number(),
        encoded_token: z.string(),
        pgp_fingerprint: z.string(),
        otp_length: z.number(),
        complete: z.boolean()
      })
    }
  });

  /**
   * Start root token generation
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#start-root-token-generation
   */
  startRootGeneration = generateCommand({
    method: 'POST',
    path: '/sys/generate-root/attempt',
    client: this,
    schema: {
      body: z.object({
        otp: z.string()
      }),
      response: z.object({
        started: z.boolean(),
        nonce: z.string(),
        progress: z.number(),
        required: z.number(),
        encoded_token: z.string(),
        otp: z.string(),
        otp_length: z.number(),
        complete: z.boolean()
      })
    }
  });

  /**
   * Cancel root generation
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#cancel-root-generation
   */
  cancelRootGeneration = generateCommand({
    method: 'DELETE',
    path: '/sys/generate-root/attempt',
    client: this,
    schema: {
      response: z.record(z.any())
    }
  });

  /**
   * Provide key share to generate root
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#provide-key-share-to-generate-root
   */
  provideKeyShare = generateCommand({
    method: 'POST',
    path: '/sys/generate-root/update',
    client: this,
    schema: {
      body: z.object({
        key: z.string(),
        nonce: z.string()
      }),
      response: z.object({
        started: z.boolean(),
        nonce: z.string(),
        progress: z.number(),
        required: z.number(),
        pgp_fingerprint: z.string(),
        complete: z.boolean(),
        encoded_token: z.string()
      })
    }
  });

  /**
   * List mounted secrets engines
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#list-mounted-secrets-engines
   */
  mounts = generateCommand({
    method: 'GET',
    path: '/sys/mounts',
    client: this,
    schema: {
      response: z.object({
        request_id: z.string(),
        lease_id: z.string(),
        lease_duration: z.number(),
        renewable: z.boolean(),
        data: z.record(EngineInfoSchema),
        warnings: z.array(z.string()).nullable()
      })
    }
  });

  /**
   * Enable secrets engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#enable-secrets-engine
   */
  mount = generateCommand({
    method: 'POST',
    path: '/sys/mounts/{{mountPath}}',
    client: this,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      body: z.object({
        type: z.string(),
        description: z.string().optional(),
        config: z.record(z.string()).optional()
      })
    }
  });

  /**
   * Disable secrets engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#disable-secrets-engine
   */
  unmount = generateCommand({
    method: 'DELETE',
    path: '/sys/mounts/{{mountPath}}',
    client: this,
    schema: {
      path: z.object({
        mountPath: z.string()
      })
    }
  });

  /**
   * Get the configuration of a secret engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#get-the-configuration-of-a-secret-engine
   */
  getMountInfo = generateCommand({
    method: 'GET',
    path: '/sys/mounts/{{mountPath}}',
    client: this,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      response: ApiResponseSchema
    }
  });

  /**
   * Read mount configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#read-mount-configuration
   */
  readMount = generateCommand({
    method: 'GET',
    path: '/sys/mounts/{{mountPath}}/tune',
    client: this,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      response: z.union([
        ErrorSchema,
        z.object({
          default_lease_ttl: z.number(),
          max_lease_ttl: z.number(),
          force_no_cache: z.boolean()
        })
      ])
    }
  });

  /**
   * Tune mount configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#tune-mount-configuration
   */
  tuneMount = generateCommand({
    method: 'POST',
    path: '/sys/mounts/{{mountPath}}/tune',
    client: this,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      body: z.object({
        default_lease_ttl: z.number().optional(),
        max_lease_ttl: z.number().optional(),
        description: z.string().optional(),
        audit_non_hmac_request_keys: z.array(z.string()).optional(),
        audit_non_hmac_response_keys: z.array(z.string()).optional(),
        listing_visibility: z.string().optional(),
        passthrough_request_headers: z.array(z.string()).optional(),
        allowed_response_headers: z.array(z.string()).optional(),
        allowed_managed_keys: z.array(z.string()).optional(),
        plugin_version: z.string().optional()
      }),
      response: ApiResponseSchema
    }
  });
}

export { Client };
