import * as z from 'zod';

import { Aws } from '@/engine/aws';
import { Kubernetes } from '@/engine/kubernetes';
import { Kv } from '@/engine/kv';
import { Kv2 } from '@/engine/kv2';
import {
  ClientOptionsSchema,
  EngineInfoSchema,
  SuccessResponseSchema,
  ZodAnyRecord
} from '@/schema';
import { ClientOptions, Fetcher } from '@/typings';
import { generateCommand } from '@/utils/generate-command';

class Client {
  endpoint: string;
  apiVersion: string;
  pathPrefix: string;
  namespace: string | undefined;
  token: string | undefined;
  request: Partial<Omit<RequestInit, 'url'>> | undefined;
  fetcher: Fetcher | undefined;

  constructor(protected opts: ClientOptions = {}) {
    const { request, fetcher, ...restOpts } = opts;
    const options = ClientOptionsSchema.parse(restOpts);

    this.endpoint = options.endpoint || process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    this.apiVersion = options.apiVersion || 'v1';
    this.pathPrefix = options.pathPrefix || '';
    this.namespace = options.namespace || process.env.VAULT_NAMESPACE;
    this.token = options.token || process.env.VAULT_TOKEN;

    this.fetcher = fetcher;
    this.request = request;
  }

  /**
   * AWS secrets engine
   */
  get aws() {
    return new Aws(this);
  }

  /**
   * Kubernetes secrets engine
   */
  get kubernetes() {
    return new Kubernetes(this);
  }

  /**
   * Key/Value Version 1
   */
  get kv() {
    return new Kv(this);
  }

  /**
   * Key/Value Version 2
   */
  get kv2() {
    return new Kv2(this);
  }

  /**
   * This property is a POST command that mainly proposed to configure the vault secrets engine.
   * Also, it can be overridden by you're custom commands inside the client instance.
   */
  config = generateCommand({
    method: 'POST',
    path: '/{{mountPath}}/config',
    client: this,
    schema: {
      path: z.object({
        mountPath: z.string()
      }),
      response: ZodAnyRecord
    }
  });

  /**
   * This property is a GET command that resolves an HTTP GET request to the given path. Also, it
   * can be overridden by you're custom commands inside the client instance.
   */
  read = generateCommand({
    method: 'GET',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      response: ZodAnyRecord
    }
  });

  /**
   * This property is a POST command that sends the `data` parameter as JSON to the given path.
   * Also, it can be overridden by you're custom commands inside the client instance.
   */
  write = generateCommand({
    method: 'POST',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      body: z.object({
        data: ZodAnyRecord
      }),
      response: z.union([ZodAnyRecord, z.boolean()])
    },
    refine: (init) => {
      // Flatten the body.data
      init.body = init.body ? (init.body as any).data || {} : {};
      return init;
    }
  });

  /**
   * This property is a DELETE command that resolves an HTTP DELETE request to the given path. Also,
   * it can be overridden by you're custom commands inside the client instance.
   */
  delete = generateCommand({
    method: 'DELETE',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      response: z.boolean()
    }
  });

  /**
   * This property is a LIST command that resolves an HTTP GET request to the given path. Also, it
   * can be overridden by you're custom commands inside the client instance.
   */
  list = generateCommand({
    method: 'LIST',
    path: '/{{path}}',
    client: this,
    schema: {
      path: z.object({
        path: z.string()
      }),
      response: ZodAnyRecord
    }
  });

  //////
  // https://developer.hashicorp.com/vault/api-docs/system/audit
  //////

  /**
   * List enabled audit devices
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/audit#list-enabled-audit-devices
   */
  get listDevices() {
    return generateCommand({
      method: 'GET',
      path: '/sys/audit',
      client: this,
      schema: {
        response: SuccessResponseSchema.extend({
          data: z.record(
            z.object({
              type: z.string(),
              description: z.string(),
              options: z.record(z.any())
            })
          )
        })
      }
    });
  }

  /**
   * Disable audit device
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/audit#disable-audit-device
   */
  get disableDevice() {
    return generateCommand({
      method: 'DELETE',
      path: '/sys/audit/{{path}}',
      client: this,
      schema: {
        path: z.object({
          path: z.string()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Enable audit device
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/audit#enable-audit-device
   */
  get enableDevice() {
    return generateCommand({
      method: 'POST',
      path: '/sys/audit/{{path}}',
      client: this,
      schema: {
        path: z.object({
          path: z.string()
        }),
        response: z.boolean()
      }
    });
  }

  ///////
  // https://developer.hashicorp.com/vault/api-docs/system/capabilities
  ///////

  /**
   * Query token capabilities
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/capabilities#query-token-capabilities
   */
  get queryCapabilities() {
    return generateCommand({
      method: 'POST',
      path: '/sys/capabilities',
      client: this,
      schema: {
        body: z.object({
          token: z.string(),
          paths: z.array(z.string())
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Seal status
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/seal-status#seal-status
   */
  get sealStatus() {
    return generateCommand({
      method: 'GET',
      path: '/sys/seal-status',
      client: this,
      schema: {
        response: z.object({
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
      }
    });
  }

  /**
   * Read initialization status
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/init#read-initialization-status
   */
  get initialized() {
    return generateCommand({
      method: 'GET',
      path: '/sys/init',
      client: this,
      schema: {
        response: z.object({
          initialized: z.boolean()
        })
      }
    });
  }

  /**
   * Start initialization
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/init#start-initialization
   */
  get init() {
    return generateCommand({
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
  }

  /**
   * Submit unseal key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/unseal#submit-unseal-key
   */
  get unseal() {
    return generateCommand({
      method: 'POST',
      path: '/sys/unseal',
      client: this,
      schema: {
        body: z.object({
          key: z.string(),
          reset: z.boolean().default(false).optional(),
          migrate: z.boolean().default(false).optional()
        }),
        response: z.discriminatedUnion('sealed', [
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
      }
    });
  }

  /**
   * Seal
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/seal#seal
   */
  get seal() {
    return generateCommand({
      method: 'POST',
      path: '/sys/seal',
      client: this,
      schema: {
        response: z.boolean()
      }
    });
  }

  /**
   * Read root generation progress
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#read-root-generation-progress
   */
  get getRootGenerationProgress() {
    return generateCommand({
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
  }

  /**
   * Start root token generation
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#start-root-token-generation
   */
  get startRootGeneration() {
    return generateCommand({
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
  }

  /**
   * Cancel root generation
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#cancel-root-generation
   */
  get cancelRootGeneration() {
    return generateCommand({
      method: 'DELETE',
      path: '/sys/generate-root/attempt',
      client: this,
      schema: {
        response: z.record(z.any())
      }
    });
  }

  /**
   * Provide key share to generate root
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/generate-root#provide-key-share-to-generate-root
   */
  get provideKeyShare() {
    return generateCommand({
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
  }

  /////////////////
  // Mounts
  // https://developer.hashicorp.com/vault/api-docs/system/mounts
  /////////////////

  /**
   * List mounted secrets engines
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#list-mounted-secrets-engines
   */
  get mounts() {
    return generateCommand({
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
  }

  /**
   * Enable secrets engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#enable-secrets-engine
   */
  get mount() {
    return generateCommand({
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
  }

  /**
   * Disable secrets engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#disable-secrets-engine
   */
  get unmount() {
    return generateCommand({
      method: 'DELETE',
      path: '/sys/mounts/{{mountPath}}',
      client: this,
      schema: {
        path: z.object({
          mountPath: z.string()
        })
      }
    });
  }

  /**
   * Get the configuration of a secret engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#get-the-configuration-of-a-secret-engine
   */
  get engineInfo() {
    return generateCommand({
      method: 'GET',
      path: '/sys/mounts/{{mountPath}}',
      client: this,
      schema: {
        path: z.object({
          mountPath: z.string()
        }),
        response: ZodAnyRecord
      }
    });
  }

  /**
   * Read mount configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#read-mount-configuration
   */
  get tune() {
    return generateCommand({
      method: 'GET',
      path: '/sys/mounts/{{mountPath}}/tune',
      client: this,
      schema: {
        path: z.object({
          mountPath: z.string()
        }),
        response: z.object({
          default_lease_ttl: z.number(),
          max_lease_ttl: z.number(),
          force_no_cache: z.boolean()
        })
      }
    });
  }

  /**
   * Tune mount configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#tune-mount-configuration
   */
  get tuneMount() {
    return generateCommand({
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
        response: ZodAnyRecord
      }
    });
  }

  /**
   * Read health information
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/health#read-health-information
   */
  get health() {
    return generateCommand({
      method: 'GET',
      path: '/sys/health',
      client: this,
      schema: {
        response: z.object({
          initialized: z.boolean(),
          sealed: z.boolean(),
          standby: z.boolean(),
          performance_standby: z.boolean(),
          replication_performance_mode: z.string(),
          replication_dr_mode: z.string(),
          server_time_utc: z.number(),
          version: z.string(),
          cluster_name: z.string(),
          cluster_id: z.string()
        })
      }
    });
  }

  /**
   * Collect host information
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/host-info#collect-host-information
   */
  get hostInfo() {
    return generateCommand({
      method: 'GET',
      path: '/sys/host-info',
      client: this,
      schema: {
        response: SuccessResponseSchema.extend({
          data: z.object({
            cpu: z.array(
              z.object({
                cpu: z.number(),
                vendorId: z.string(),
                family: z.string(),
                model: z.string(),
                stepping: z.number(),
                physicalId: z.string(),
                coreId: z.string(),
                cores: z.number(),
                modelName: z.string(),
                mhz: z.number(),
                cacheSize: z.number(),
                flags: z.array(z.string()),
                microcode: z.string()
              })
            ),
            cpu_times: z.array(
              z.object({
                cpu: z.string(),
                user: z.number(),
                system: z.number(),
                idle: z.number(),
                nice: z.number(),
                iowait: z.number(),
                irq: z.number(),
                softirq: z.number(),
                steal: z.number(),
                guest: z.number(),
                guestNice: z.number()
              })
            ),
            disk: z.array(
              z.object({
                path: z.string(),
                fstype: z.string(),
                total: z.number(),
                free: z.number(),
                used: z.number(),
                usedPercent: z.number(),
                inodesTotal: z.number(),
                inodesUsed: z.number(),
                inodesFree: z.number(),
                inodesUsedPercent: z.number()
              })
            ),
            host: z.object({
              hostname: z.string(),
              uptime: z.number(),
              bootTime: z.number(),
              procs: z.number(),
              os: z.string(),
              platform: z.string(),
              platformFamily: z.string(),
              platformVersion: z.string(),
              kernelVersion: z.string(),
              kernelArch: z.string(),
              virtualizationSystem: z.string(),
              virtualizationRole: z.string(),
              hostid: z.string()
            }),
            memory: z.object({
              total: z.number(),
              available: z.number(),
              used: z.number(),
              usedPercent: z.number(),
              free: z.number(),
              active: z.number(),
              inactive: z.number(),
              wired: z.number(),
              laundry: z.number(),
              buffers: z.number(),
              cached: z.number(),
              writeback: z.number(),
              dirty: z.number(),
              writebacktmp: z.number(),
              shared: z.number(),
              slab: z.number(),
              sreclaimable: z.number(),
              sunreclaim: z.number(),
              pagetables: z.number(),
              swapcached: z.number(),
              commitlimit: z.number(),
              committedas: z.number(),
              hightotal: z.number(),
              highfree: z.number(),
              lowtotal: z.number(),
              lowfree: z.number(),
              swaptotal: z.number(),
              swapfree: z.number(),
              mapped: z.number(),
              vmalloctotal: z.number(),
              vmallocused: z.number(),
              vmallocchunk: z.number(),
              hugepagestotal: z.number(),
              hugepagesfree: z.number(),
              hugepagesize: z.number()
            }),
            timestamp: z.string()
          })
        })
      }
    });
  }
}

export { Client };
