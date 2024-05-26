listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

api_addr = "http://127.0.0.1:8200"
cluster_addr = "https://127.0.0.1:8201"

// https://developer.hashicorp.com/vault/docs/configuration/storage/in-memory
storage "inmem" {}
