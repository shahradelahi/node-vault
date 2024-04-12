import { ApiSector } from '@/lib/sector';
import { ErrorResponseSchema, ZodAnyRecord } from '@/schema';
import { generateCommand } from '@litehex/node-vault';
import { z } from 'zod';

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
        // Parameters
        //
        //     kubernetes_host (string: "https://$KUBERNETES_SERVICE_HOST:KUBERNETES_SERVICE_PORT_HTTPS") - Kubernetes API URL to connect to. Must be specified if the standard pod environment variables KUBERNETES_SERVICE_HOST or KUBERNETES_SERVICE_PORT_HTTPS are not set.
        //     kubernetes_ca_cert (string: "") - PEM encoded CA certificate to verify the Kubernetes API server certificate. Defaults to the local pod's CA certificate at /var/run/secrets/kubernetes.io/serviceaccount/ca.crt if found, or otherwise the host's root CA set.
        //     service_account_jwt (string: "") - The JSON web token of the service account used by the secrets engine to manage Kubernetes credentials. Defaults to the local pod's JWT at /var/run/secrets/kubernetes.io/serviceaccount/token if found.
        //     disable_local_ca_jwt (bool: false) - Disable defaulting to the local CA certificate and service account JWT when running in a Kubernetes pod.
        body: z.object({
          kubernetes_host: z.string().optional(),
          kubernetes_ca_cert: z.string().optional(),
          service_account_jwt: z.string().optional(),
          disable_local_ca_jwt: z.boolean().optional()
        }),
        response: z.any()
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
        response: ErrorResponseSchema.or(ZodAnyRecord)
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
        response: ErrorResponseSchema.or(z.boolean())
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
        // Parameters
        //
        //     name (string: <required>) - The name of the role. Included in the path.
        //     allowed_kubernetes_namespaces (array: []) - The list of Kubernetes namespaces this role can generate credentials for. If set to "*" all namespaces are allowed. If set with allowed_kubernetes_namespace_selector, the conditions are ORed.
        //     allowed_kubernetes_namespace_selector (string: "") - A label selector for Kubernetes namespaces in which credentials can be generated. Accepts either a JSON or YAML object. The value should be of type LabelSelector as illustrated in Sample Payload 4 and Sample Payload 5 below. If set with allowed_kubernetes_namespaces, the conditions are ORed.
        //     token_max_ttl (string: "") - The maximum TTL for generated Kubernetes tokens, specified in seconds or as a Go duration format string, e.g. "1h". If not set or set to 0, the system default will be used.
        //     token_default_ttl (string: "") - The default TTL for generated Kubernetes tokens, specified in seconds or as a Go duration format string, e.g. "1h". If not set or set to 0, the system default will be used.
        //     token_default_audiences (string: "") - The default intended audiences for generated Kubernetes tokens, specified by a comma separated string. e.g "custom-audience-0,custom-audience-1". If not set or set to "", the Kubernetes cluster default for audiences of service account tokens will be used.
        //     service_account_name (string: "") - The pre-existing service account to generate tokens for. Mutually exclusive with all role parameters. If set, only a Kubernetes token will be created when credentials are requested. See the Kubernetes service account documentation for more details on service accounts.
        //     kubernetes_role_name (string: "") - The pre-existing Role or ClusterRole to bind a generated service account to. If set, Kubernetes token, service account, and role binding objects will be created when credentials are requested. See the Kubernetes roles documentation for more details on Kubernetes roles.
        //     kubernetes_role_type (string: "Role") - Specifies whether the Kubernetes role is a Role or ClusterRole.
        //     generated_role_rules (string: "") - The Role or ClusterRole rules to use when generating a role. Accepts either JSON or YAML formatted rules. If set, the entire chain of Kubernetes objects will be generated when credentials are requested. The value should be a rules key with an array of PolicyRule objects, as illustrated in the Kubernetes RBAC documentation and Sample Payload 3 below.
        //     name_template (string: "") - The name template to use when generating service accounts, roles and role bindings. If unset, a default template is used. See username templating for details on how to write a custom template.
        //     extra_annotations (map<string|string>: nil) - Additional annotations to apply to all generated Kubernetes objects. See the Kubernetes annotations documentation for more details on annotations.
        //     extra_labels (map<string|string>: nil) - Additional labels to apply to all generated Kubernetes objects. See the Kubernetes labels documentation for more details on labels.
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
        response: z.any()
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
        response: ErrorResponseSchema.or(ZodAnyRecord)
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
        response: ErrorResponseSchema.or(ZodAnyRecord)
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
        response: ErrorResponseSchema.or(z.boolean())
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
        // Parameters
        //
        //     role (string: <required>) - Name of the role to generate credentials for.
        //     kubernetes_namespace (string) - The name of the Kubernetes namespace in which to generate the credentials. Optional if the Vault role is configured with a single namespace that is not "*"; required otherwise.
        //     cluster_role_binding (bool: false) - If true, generate a ClusterRoleBinding to grant permissions across the whole cluster instead of within a namespace. Requires the Vault role to have kubernetes_role_type set to ClusterRole.
        //     ttl (string: "") - The TTL of the generated Kubernetes service account token, specified in seconds or as a Go duration format string, e.g. "1h". The TTL returned may be different from the TTL specified due to limits specified in Kubernetes, Vault system-wide controls, or role-specific controls.
        //     audiences (string: "") - A comma separated string containing the intended audiences of the generated Kubernetes service account the token, e.g. "custom-audience-0,custom-audience-1". If not set or set to "", the token_default_audiences will be used.
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
        response: ErrorResponseSchema.or(ZodAnyRecord)
      }
    });
  }
}
