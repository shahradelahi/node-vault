import * as z from 'zod';

import { ApiSector } from '@/lib/sector';
import { ZodAnyRecord } from '@/schema';
import { generateCommand } from '@/utils/generate-command';

/**
 * Kubernetes secrets engine (API)
 *
 * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes
 */
export class Kubernetes extends ApiSector {
  /**
   * Write configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#write-configuration
   */
  get config() {
    return generateCommand({
      method: 'POST',
      path: '/kubernetes/config',
      client: this.client,
      schema: {
        body: z.object({
          kubernetes_host: z.string().optional(),
          kubernetes_ca_cert: z.string().optional(),
          service_account_jwt: z.string().optional(),
          disable_local_ca_jwt: z.boolean().optional()
        }),
        response: ZodAnyRecord
      }
    });
  }

  /**
   * Read configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#read-configuration
   */
  get readConfig() {
    return generateCommand({
      method: 'GET',
      path: '/kubernetes/config',
      client: this.client,
      schema: {
        response: ZodAnyRecord
      }
    });
  }

  /**
   * Delete configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#delete-configuration
   */
  get deleteConfig() {
    return generateCommand({
      method: 'DELETE',
      path: '/kubernetes/config',
      client: this.client,
      schema: {
        response: z.boolean()
      }
    });
  }

  /**
   * Create role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#create-role
   */
  get createRole() {
    return generateCommand({
      method: 'POST',
      path: '/kubernetes/roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        body: z.object({
          allowed_kubernetes_namespaces: z.array(z.string()).optional(),
          allowed_kubernetes_namespace_selector: z.string().optional(),
          token_max_ttl: z.string().optional(),
          token_default_ttl: z.string().optional(),
          token_default_audiences: z.string().optional(),
          service_account_name: z.string().optional(),
          kubernetes_role_name: z.string().optional(),
          kubernetes_role_type: z.string().optional(),
          generated_role_rules: z.string().optional(),
          name_template: z.string().optional(),
          extra_annotations: z.record(z.string()).optional(),
          extra_labels: z.record(z.string()).optional()
        }),
        response: ZodAnyRecord
      }
    });
  }

  /**
   * Read role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#read-role
   */
  get role() {
    return generateCommand({
      method: 'GET',
      path: '/kubernetes/roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        response: ZodAnyRecord
      }
    });
  }

  /**
   * List roles
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#list-roles
   */
  get roles() {
    return generateCommand({
      method: 'LIST',
      path: '/kubernetes/roles',
      client: this.client,
      schema: {
        response: ZodAnyRecord
      }
    });
  }

  /**
   * Delete role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#delete-role
   */
  get deleteRole() {
    return generateCommand({
      method: 'DELETE',
      path: '/kubernetes/roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        response: z.boolean()
      }
    });
  }

  /**
   * Generate credentials
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/kubernetes#generate-credentials
   */
  get generateCreds() {
    return generateCommand({
      method: 'POST',
      path: '/kubernetes/creds/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        body: z.object({
          role: z.string(),
          kubernetes_namespace: z.string().optional(),
          cluster_role_binding: z.boolean().optional(),
          ttl: z.string().optional(),
          audiences: z.string().optional()
        }),
        response: ZodAnyRecord
      }
    });
  }
}
