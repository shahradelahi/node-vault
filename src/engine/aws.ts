import { ApiSector } from '@/lib/sector';
import { generateCommand } from '@litehex/node-vault';
import { z } from 'zod';

/**
 * AWS secrets engine (API)
 *
 * @link https://developer.hashicorp.com/vault/api-docs/secret/aws
 */
export class Aws extends ApiSector {
  /**
   * IAM
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#iam
   */
  get config() {
    return generateCommand({
      method: 'POST',
      path: '/aws/config/root',
      client: this.client,
      schema: {
        body: z.object({
          max_retries: z.number().optional(),
          access_key: z.string().optional(),
          secret_key: z.string().optional(),
          role_arn: z.string().optional(),
          identity_token_audience: z.string().optional(),
          identity_token_ttl: z.string().optional(),
          region: z.string().optional(),
          iam_endpoint: z.string().optional(),
          sts_endpoint: z.string().optional(),
          username_template: z.string().optional()
        }),
        response: z.any()
      }
    });
  }

  /**
   * Read root configuration
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#read-root-configuration
   */
  get rootInfo() {
    return generateCommand({
      method: 'GET',
      path: '/aws/config/root',
      client: this.client,
      schema: {
        response: z.any()
      }
    });
  }

  /**
   * Rotate root IAM credentials
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#rotate-root-iam-credentials
   */
  get rotateRoot() {
    return generateCommand({
      method: 'POST',
      path: '/aws/config/rotate-root',
      client: this.client,
      schema: {
        response: z.any()
      }
    });
  }

  /**
   * Configure lease
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#configure-lease
   */
  get configLease() {
    return generateCommand({
      method: 'POST',
      path: '/aws/config/lease',
      client: this.client,
      schema: {
        body: z.object({
          lease: z.string(),
          lease_max: z.number()
        }),
        response: z.any()
      }
    });
  }

  /**
   * Read lease
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#read-lease
   */
  get lease() {
    return generateCommand({
      method: 'POST',
      path: '/aws/config/lease',
      client: this.client,
      schema: {
        response: z.any()
      }
    });
  }

  /**
   * Create/Update role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#create-update-role
   */
  get role() {
    return generateCommand({
      method: 'POST',
      path: '/aws/config/role',
      client: this.client,
      schema: {
        body: z.object({
          name: z.string(),
          credential_type: z.string(),
          role_arns: z.array(z.string()).optional(),
          policy_arns: z.array(z.string()).optional(),
          policy_document: z.string().optional(),
          iam_groups: z.array(z.string()).optional(),
          iam_tags: z.array(z.string()).optional(),
          default_sts_ttl: z.string().optional(),
          max_sts_ttl: z.string().optional(),
          user_path: z.string().optional(),
          permissions_boundary_arn: z.string().optional(),
          mfa_serial_number: z.string().optional(),
          policy: z.string().optional(),
          arn: z.string().optional()
        }),
        response: z.any()
      }
    });
  }

  /**
   * Read role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#read-role
   */
  get roleInfo() {
    return generateCommand({
      method: 'GET',
      path: '/aws/roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        response: z.any()
      }
    });
  }

  /**
   * List roles
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#list-roles
   */
  get roles() {
    return generateCommand({
      method: 'LIST',
      path: '/aws/roles',
      client: this.client,
      schema: {
        response: z.any()
      }
    });
  }

  /**
   * Delete role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#delete-role
   */
  get deleteRole() {
    return generateCommand({
      method: 'DELETE',
      path: '/aws/roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        response: z.any()
      }
    });
  }

  /**
   * Generate credentials
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#generate-credentials
   */
  get credentials() {
    return generateCommand({
      method: 'GET',
      path: '/aws/creds/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        searchParams: z.object({
          role_arn: z.string().optional(),
          role_session_name: z.string().optional(),
          ttl: z.string().optional(),
          mfa_code: z.string().optional()
        }),
        response: z.any()
      }
    });
  }

  /**
   * Create/Update static role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#create-update-static-role
   */
  get staticRole() {
    return generateCommand({
      method: 'POST',
      path: '/aws/static-roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        body: z.object({
          username: z.string(),
          rotation_period: z.union([z.string(), z.number()])
        }),
        response: z.any()
      }
    });
  }

  /**
   * Read static role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#read-static-role
   */
  get staticRoleInfo() {
    return generateCommand({
      method: 'GET',
      path: '/aws/static-roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        response: z.any()
      }
    });
  }

  /**
   * Delete static role
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#delete-static-role
   */
  get deleteStaticRole() {
    return generateCommand({
      method: 'DELETE',
      path: '/aws/static-roles/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        response: z.any()
      }
    });
  }

  /**
   * Get static credentials
   *
   * @link https://developer.hashicorp.com/vault/api-docs/secret/aws#get-static-credentials
   */
  get staticCredentials() {
    return generateCommand({
      method: 'GET',
      path: '/aws/static-creds/{{name}}',
      client: this.client,
      schema: {
        path: z.object({
          name: z.string()
        }),
        response: z.any()
      }
    });
  }
}
