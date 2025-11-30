# =============================================================================
# OSIA UIN Generator - Terraform Infrastructure Configuration
# Multi-host deployment with HSM and HashiCorp Vault support
# =============================================================================

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.0"
    }
  }

  # Backend configuration - use local for development
  backend "local" {
    path = "terraform.tfstate"
  }
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  # Environment configuration
  environment = var.environment
  project     = "osia-uin-generator"

  # Host configurations
  hosts = {
    localhost = {
      ip       = "127.0.0.1"
      role     = "development"
      api_port = 19020
      web_port = 9898
    }
    node1 = {
      ip       = "192.168.0.5"
      role     = "api"
      api_port = 19020
      web_port = 9898
    }
    node2 = {
      ip       = "192.168.0.16"
      role     = "api"
      api_port = 19020
      web_port = 9898
    }
    node3 = {
      ip       = "192.168.0.18"
      role     = "api"
      api_port = 19020
      web_port = 9898
    }
  }

  # Common tags
  common_tags = {
    Project     = local.project
    Environment = local.environment
    ManagedBy   = "terraform"
  }
}

# =============================================================================
# Vault Provider Configuration
# =============================================================================

provider "vault" {
  address = var.vault_address
  token   = var.vault_token

  # Skip TLS verification for development
  skip_tls_verify = var.environment == "development"
}

# =============================================================================
# Vault Secrets Engine for UIN Generator
# =============================================================================

resource "vault_mount" "osia_secrets" {
  count = var.enable_vault ? 1 : 0

  path        = "osia"
  type        = "kv-v2"
  description = "OSIA UIN Generator secrets"

  options = {
    version = "2"
  }
}

# Store sector secrets in Vault
resource "vault_kv_secret_v2" "sector_secrets" {
  count = var.enable_vault ? 1 : 0

  mount = vault_mount.osia_secrets[0].path
  name  = "sector-secrets"

  data_json = jsonencode({
    health     = var.sector_secret_health
    tax        = var.sector_secret_tax
    finance    = var.sector_secret_finance
    telco      = var.sector_secret_telco
    stats      = var.sector_secret_stats
    education  = var.sector_secret_education
    social     = var.sector_secret_social
    government = var.sector_secret_government
  })
}

# Store database credentials in Vault
resource "vault_kv_secret_v2" "database_credentials" {
  count = var.enable_vault ? 1 : 0

  mount = vault_mount.osia_secrets[0].path
  name  = "database"

  data_json = jsonencode({
    host     = var.db_host
    port     = var.db_port
    username = var.db_username
    password = var.db_password
    database = var.db_name
  })
}

# HSM configuration in Vault
resource "vault_kv_secret_v2" "hsm_config" {
  count = var.enable_vault && var.enable_hsm ? 1 : 0

  mount = vault_mount.osia_secrets[0].path
  name  = "hsm"

  data_json = jsonencode({
    provider    = var.hsm_provider
    library     = var.hsm_library_path
    slot        = var.hsm_slot
    pin         = var.hsm_pin
    key_label   = var.hsm_key_label
  })
}

# =============================================================================
# Vault Policy for UIN Generator
# =============================================================================

resource "vault_policy" "osia_uin_policy" {
  count = var.enable_vault ? 1 : 0

  name   = "osia-uin-generator"
  policy = <<-EOT
    # Read sector secrets
    path "osia/data/sector-secrets" {
      capabilities = ["read"]
    }

    # Read database credentials
    path "osia/data/database" {
      capabilities = ["read"]
    }

    # Read HSM configuration
    path "osia/data/hsm" {
      capabilities = ["read"]
    }

    # Allow token renewal
    path "auth/token/renew-self" {
      capabilities = ["update"]
    }

    # Allow checking own capabilities
    path "sys/capabilities-self" {
      capabilities = ["update"]
    }
  EOT
}

# =============================================================================
# AppRole Authentication for UIN Generator
# =============================================================================

resource "vault_auth_backend" "approle" {
  count = var.enable_vault ? 1 : 0

  type = "approle"
  path = "approle"
}

resource "vault_approle_auth_backend_role" "osia_uin" {
  count = var.enable_vault ? 1 : 0

  backend        = vault_auth_backend.approle[0].path
  role_name      = "osia-uin-generator"
  token_policies = [vault_policy.osia_uin_policy[0].name]

  token_ttl     = 3600
  token_max_ttl = 86400

  secret_id_ttl             = 86400
  secret_id_num_uses        = 0
  token_num_uses            = 0
  token_explicit_max_ttl    = 0
  bind_secret_id            = true
}

resource "vault_approle_auth_backend_role_secret_id" "osia_uin" {
  count = var.enable_vault ? 1 : 0

  backend   = vault_auth_backend.approle[0].path
  role_name = vault_approle_auth_backend_role.osia_uin[0].role_name
}

# =============================================================================
# Host Deployment Configuration
# =============================================================================

resource "null_resource" "deploy_api" {
  for_each = var.deploy_hosts ? local.hosts : {}

  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Configuring OSIA UIN Generator on ${each.key} (${each.value.ip})"
      echo "Role: ${each.value.role}"
      echo "API Port: ${each.value.api_port}"
      echo "Web Port: ${each.value.web_port}"
    EOT
  }
}

# =============================================================================
# Generate Environment Configuration Files
# =============================================================================

resource "local_file" "env_config" {
  for_each = local.hosts

  filename = "${path.module}/generated/${each.key}.env"
  content  = <<-EOT
    # OSIA UIN Generator Configuration
    # Generated by Terraform - ${timestamp()}
    # Host: ${each.key} (${each.value.ip})

    # Server Configuration
    NODE_ENV=${local.environment}
    PORT=${each.value.api_port}
    HOST=${each.value.ip}

    # Database Configuration
    OSIA_DB_HOST=${var.db_host}
    OSIA_DB_PORT=${var.db_port}
    OSIA_DB_USER=${var.db_username}
    OSIA_DB_NAME=${var.db_name}
    # Note: Password should be retrieved from Vault in production

    # Vault Configuration
    VAULT_ENABLED=${var.enable_vault}
    VAULT_ADDR=${var.vault_address}
    VAULT_ROLE_ID=${var.enable_vault ? vault_approle_auth_backend_role.osia_uin[0].role_id : ""}
    # Note: Secret ID should be retrieved securely

    # HSM Configuration
    HSM_ENABLED=${var.enable_hsm}
    HSM_PROVIDER=${var.hsm_provider}
    HSM_LIBRARY=${var.hsm_library_path}
    HSM_SLOT=${var.hsm_slot}

    # Security
    UIN_ENABLE_CORS=true
    UIN_CORS_ORIGIN=${var.cors_origin}

    # Logging
    LOG_LEVEL=${var.log_level}
  EOT

  file_permission = "0600"
}

# =============================================================================
# PM2 Ecosystem Configuration
# =============================================================================

resource "local_file" "pm2_ecosystem" {
  filename = "${path.module}/generated/ecosystem.config.cjs"
  content  = <<-EOT
    // PM2 Ecosystem Configuration
    // Generated by Terraform - ${timestamp()}

    module.exports = {
      apps: [
        ${join(",\n        ", [for name, host in local.hosts : <<-APP
        {
          name: 'osia-uin-api-${name}',
          script: 'src/server.mjs',
          cwd: '${var.app_root}',
          instances: 1,
          autorestart: true,
          watch: false,
          max_memory_restart: '500M',
          env: {
            NODE_ENV: '${local.environment}',
            PORT: ${host.api_port},
            HOST: '${host.ip}',
            VAULT_ENABLED: '${var.enable_vault}',
            VAULT_ADDR: '${var.vault_address}',
            HSM_ENABLED: '${var.enable_hsm}'
          }
        }
        APP
        ])}
      ]
    };
  EOT

  file_permission = "0644"
}

# =============================================================================
# Outputs
# =============================================================================

output "hosts" {
  description = "Configured hosts"
  value       = local.hosts
}

output "vault_enabled" {
  description = "Whether Vault is enabled"
  value       = var.enable_vault
}

output "hsm_enabled" {
  description = "Whether HSM is enabled"
  value       = var.enable_hsm
}

output "vault_role_id" {
  description = "Vault AppRole Role ID"
  value       = var.enable_vault ? vault_approle_auth_backend_role.osia_uin[0].role_id : null
  sensitive   = true
}

output "vault_secret_id" {
  description = "Vault AppRole Secret ID"
  value       = var.enable_vault ? vault_approle_auth_backend_role_secret_id.osia_uin[0].secret_id : null
  sensitive   = true
}

output "env_files" {
  description = "Generated environment files"
  value       = [for name, host in local.hosts : "${path.module}/generated/${name}.env"]
}
