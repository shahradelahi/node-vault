import * as z from 'zod';

import { ApiSector } from '@/lib/sector';
import { SuccessResponseSchema, ZodAnyRecord } from '@/schema';
import { generateCommand } from '@/utils/generate-command';

import { EngineInfoSchema } from './kv';

/**
 * Transit secrets engine
 *
 * @link https://developer.hashicorp.com/vault/api-docs/secret/transit
 */
export class Transit extends ApiSector {
  /**
   * Enable Transit engine
   *
   * @link https://developer.hashicorp.com/vault/api-docs/system/mounts#enable-secrets-engine
   */
  get enable() {
    return generateCommand({
      method: 'POST',
      path: '/sys/mounts/{{mountPath}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string()
        }),
        body: z.object({
          type: z.literal('transit'),
          description: z.string().optional(),
          config: z
            .object({
              force_no_cache: z.boolean().optional(),
              default_lease_ttl: z.string().optional(),
              max_lease_ttl: z.string().optional()
            })
            .optional()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Create encryption key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#create-key
   */
  get createKey() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/keys/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          type: z
            .enum([
              'aes256-gcm96',
              'chacha20-poly1305',
              'ed25519',
              'ecdsa-p256',
              'ecdsa-p384',
              'ecdsa-p521',
              'rsa-2048',
              'rsa-3072',
              'rsa-4096'
            ])
            .optional(),
          convergent_encryption: z.boolean().optional(),
          derived: z.boolean().optional(),
          exportable: z.boolean().optional(),
          allow_plaintext_backup: z.boolean().optional(),
          auto_rotate_period: z.string().optional()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Read key configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#read-key
   */
  get readKey() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/keys/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        response: ReadKeyResponseSchema
      }
    });
  }

  /**
   * Update key configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#update-key-configuration
   */
  get updateKey() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/keys/{{name}}/config',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          min_decryption_version: z.number().optional(),
          min_encryption_version: z.number().optional(),
          deletion_allowed: z.boolean().optional(),
          exportable: z.boolean().optional(),
          allow_plaintext_backup: z.boolean().optional(),
          auto_rotate_period: z.string().optional()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Delete/Disable key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#delete-key
   */
  get deleteKey() {
    return generateCommand({
      method: 'DELETE',
      path: '/{{mountPath}}/keys/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * List keys
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#list-keys
   */
  get listKeys() {
    return generateCommand({
      method: 'LIST',
      path: '/{{mountPath}}/keys',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string()
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
   * Encrypt data
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#encrypt-data
   */
  get encrypt() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/encrypt/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          plaintext: z.string(),
          context: z.string().optional(),
          key_version: z.number().optional(),
          nonce: z.string().optional(),
          batch_input: z
            .array(
              z.object({
                plaintext: z.string(),
                context: z.string().optional(),
                key_version: z.number().optional(),
                nonce: z.string().optional()
              })
            )
            .optional()
        }),
        response: EncryptResponseSchema
      }
    });
  }

  /**
   * Decrypt data
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#decrypt-data
   */
  get decrypt() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/decrypt/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          ciphertext: z.string(),
          context: z.string().optional(),
          nonce: z.string().optional(),
          batch_input: z
            .array(
              z.object({
                ciphertext: z.string(),
                context: z.string().optional(),
                nonce: z.string().optional()
              })
            )
            .optional()
        }),
        response: DecryptResponseSchema
      }
    });
  }

  /**
   * Rewrap data
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#rewrap-data
   */
  get rewrap() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/rewrap/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          ciphertext: z.string(),
          context: z.string().optional(),
          key_version: z.number().optional(),
          nonce: z.string().optional(),
          batch_input: z
            .array(
              z.object({
                ciphertext: z.string(),
                context: z.string().optional(),
                key_version: z.number().optional(),
                nonce: z.string().optional()
              })
            )
            .optional()
        }),
        response: EncryptResponseSchema
      }
    });
  }

  /**
   * Generate data key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#generate-data-key
   */
  get generateDataKey() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/datakey/{{type}}/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string(),
          type: z.enum(['plaintext', 'wrapped'])
        }),
        body: z.object({
          context: z.string().optional(),
          key_version: z.number().optional(),
          nonce: z.string().optional(),
          bits: z.number().optional()
        }),
        response: GenerateDataKeyResponseSchema
      }
    });
  }

  /**
   * Generate random bytes
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#generate-random-bytes
   */
  get generateRandom() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/random/{{source}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          source: z.string().optional()
        }),
        body: z.object({
          bytes: z.number().optional(),
          format: z.enum(['hex', 'base64']).optional()
        }),
        response: GenerateRandomResponseSchema
      }
    });
  }

  /**
   * Hash data
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#hash-data
   */
  get hash() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/hash/{{algorithm}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          algorithm: z.string()
        }),
        body: z.object({
          input: z.string(),
          format: z.enum(['hex', 'base64']).optional(),
          batch_input: z
            .array(
              z.object({
                input: z.string(),
                format: z.enum(['hex', 'base64']).optional()
              })
            )
            .optional()
        }),
        response: HashResponseSchema
      }
    });
  }

  /**
   * Generate HMAC
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#generate-hmac
   */
  get hmac() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/hmac/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          input: z.string(),
          algorithm: z.string().optional(),
          key_version: z.number().optional(),
          batch_input: z
            .array(
              z.object({
                input: z.string(),
                algorithm: z.string().optional(),
                key_version: z.number().optional()
              })
            )
            .optional()
        }),
        response: HmacResponseSchema
      }
    });
  }

  /**
   * Verify HMAC
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#verify-hmac
   */
  get verifyHmac() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/verify/{{name}}/{{algorithm}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string(),
          algorithm: z.string()
        }),
        body: z.object({
          input: z.string(),
          hmac: z.string(),
          key_version: z.number().optional(),
          batch_input: z
            .array(
              z.object({
                input: z.string(),
                hmac: z.string(),
                key_version: z.number().optional()
              })
            )
            .optional()
        }),
        response: VerifyResponseSchema
      }
    });
  }

  /**
   * Sign data
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#sign-data
   */
  get sign() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/sign/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          input: z.string(),
          key_version: z.number().optional(),
          context: z.string().optional(),
          prehashed: z.boolean().optional(),
          signature_algorithm: z.string().optional(),
          marshaling_algorithm: z.string().optional(),
          salt_length: z.string().optional(),
          batch_input: z
            .array(
              z.object({
                input: z.string(),
                key_version: z.number().optional(),
                context: z.string().optional(),
                prehashed: z.boolean().optional(),
                signature_algorithm: z.string().optional(),
                marshaling_algorithm: z.string().optional(),
                salt_length: z.string().optional()
              })
            )
            .optional()
        }),
        response: SignResponseSchema
      }
    });
  }

  /**
   * Verify signature
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#verify-signed-data
   */
  get verify() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/verify/{{name}}/{{algorithm}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string(),
          algorithm: z.string()
        }),
        body: z.object({
          input: z.string(),
          signature: z.string(),
          key_version: z.number().optional(),
          context: z.string().optional(),
          prehashed: z.boolean().optional(),
          signature_algorithm: z.string().optional(),
          marshaling_algorithm: z.string().optional(),
          salt_length: z.string().optional(),
          batch_input: z
            .array(
              z.object({
                input: z.string(),
                signature: z.string(),
                key_version: z.number().optional(),
                context: z.string().optional(),
                prehashed: z.boolean().optional(),
                signature_algorithm: z.string().optional(),
                marshaling_algorithm: z.string().optional(),
                salt_length: z.string().optional()
              })
            )
            .optional()
        }),
        response: VerifyResponseSchema
      }
    });
  }

  /**
   * Rotate key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#rotate-key
   */
  get rotateKey() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/keys/{{name}}/rotate',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Export key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#export-key
   */
  get exportKey() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/export/{{type}}/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string(),
          type: z.enum(['encryption-key', 'signing-key', 'hmac-key'])
        }),
        searchParams: z.object({
          version: z.string().optional()
        }),
        response: ExportKeyResponseSchema
      }
    });
  }

  /**
   * Backup key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#backup-key
   */
  get backupKey() {
    return generateCommand({
      method: 'GET',
      path: '/{{mountPath}}/backup/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        response: SuccessResponseSchema.extend({
          data: z.object({
            backup: z.string()
          })
        })
      }
    });
  }

  /**
   * Restore key
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#restore-key
   */
  get restoreKey() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/restore/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          backup: z.string(),
          force: z.boolean().optional()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Trim key versions
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/transit#trim-key-versions
   */
  get trimKey() {
    return generateCommand({
      method: 'POST',
      path: '/{{mountPath}}/keys/{{name}}/trim',
      client: this.client,
      schema: {
        path: z.object({
          mountPath: z.string(),
          name: z.string()
        }),
        body: z.object({
          min_available_version: z.number()
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
        response: EngineInfoSchema
      }
    });
  }
}

// Schema definitions
const KeyMetadataSchema = z.object({
  creation_time: z.string(),
  name: z.string(),
  public_key: z.string().optional(),
  hsm_handle: z.string().optional()
});

const ReadKeyResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    type: z.string(),
    keys: z.record(KeyMetadataSchema),
    latest_version: z.number(),
    min_available_version: z.number(),
    min_decryption_version: z.number(),
    min_encryption_version: z.number(),
    supports_encryption: z.boolean(),
    supports_decryption: z.boolean(),
    supports_derivation: z.boolean(),
    supports_signing: z.boolean(),
    supports_verification: z.boolean(),
    supports_export: z.boolean(),
    exportable: z.boolean(),
    allow_plaintext_backup: z.boolean(),
    convergent_encryption: z.boolean(),
    derived: z.boolean(),
    auto_rotate_period: z.string().optional(),
    deletion_allowed: z.boolean()
  })
});

const EncryptResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    ciphertext: z.string().optional(),
    key_version: z.number().optional(),
    batch_results: z
      .array(
        z.object({
          ciphertext: z.string(),
          key_version: z.number()
        })
      )
      .optional()
  })
});

const DecryptResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    plaintext: z.string().optional(),
    batch_results: z
      .array(
        z.object({
          plaintext: z.string()
        })
      )
      .optional()
  })
});

const HashResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    sum: z.string().optional(),
    batch_results: z
      .array(
        z.object({
          sum: z.string()
        })
      )
      .optional()
  })
});

const HmacResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    hmac: z.string().optional(),
    batch_results: z
      .array(
        z.object({
          hmac: z.string()
        })
      )
      .optional()
  })
});

const VerifyResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    valid: z.boolean().optional(),
    batch_results: z
      .array(
        z.object({
          valid: z.boolean()
        })
      )
      .optional()
  })
});

const SignResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    signature: z.string().optional(),
    key_version: z.number().optional(),
    batch_results: z
      .array(
        z.object({
          signature: z.string(),
          key_version: z.number()
        })
      )
      .optional()
  })
});

const GenerateDataKeyResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    plaintext: z.string().optional(),
    ciphertext: z.string().optional(),
    key_version: z.number()
  })
});

const GenerateRandomResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    random_bytes: z.string()
  })
});

const ExportKeyResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    name: z.string(),
    type: z.string(),
    keys: z.record(z.string())
  })
});
