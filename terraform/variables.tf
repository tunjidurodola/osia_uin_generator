# =============================================================================
# OSIA UIN Generator - Terraform Variables
# =============================================================================

# -----------------------------------------------------------------------------
# Environment
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "development"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "app_root" {
  description = "Application root directory"
  type        = string
  default     = "/scripts/dev/osia/uin-generator"
}

# -----------------------------------------------------------------------------
# Deployment Options
# -----------------------------------------------------------------------------

variable "deploy_hosts" {
  description = "Whether to deploy to remote hosts"
  type        = bool
  default     = false
}

variable "cors_origin" {
  description = "CORS allowed origin"
  type        = string
  default     = "*"
}

variable "log_level" {
  description = "Logging level"
  type        = string
  default     = "info"
}

# -----------------------------------------------------------------------------
# HashiCorp Vault
# -----------------------------------------------------------------------------

variable "enable_vault" {
  description = "Enable HashiCorp Vault integration"
  type        = bool
  default     = true
}

variable "vault_address" {
  description = "HashiCorp Vault address"
  type        = string
  default     = "http://127.0.0.1:8200"
}

variable "vault_token" {
  description = "HashiCorp Vault token (for initial setup)"
  type        = string
  sensitive   = true
  default     = ""
}

# -----------------------------------------------------------------------------
# HSM Configuration
# -----------------------------------------------------------------------------

variable "enable_hsm" {
  description = "Enable HSM integration"
  type        = bool
  default     = false
}

variable "hsm_provider" {
  description = "HSM provider type"
  type        = string
  default     = "softhsm"

  validation {
    condition     = contains(["softhsm", "thales", "aws-cloudhsm", "azure-keyvault", "yubihsm"], var.hsm_provider)
    error_message = "HSM provider must be one of: softhsm, thales, aws-cloudhsm, azure-keyvault, yubihsm."
  }
}

variable "hsm_library_path" {
  description = "Path to PKCS#11 library"
  type        = string
  default     = "/usr/lib/softhsm/libsofthsm2.so"
}

variable "hsm_slot" {
  description = "HSM slot number"
  type        = number
  default     = 0
}

variable "hsm_pin" {
  description = "HSM PIN"
  type        = string
  sensitive   = true
  default     = ""
}

variable "hsm_key_label" {
  description = "HSM key label for sector token derivation"
  type        = string
  default     = "osia-sector-key"
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "db_host" {
  description = "Database host"
  type        = string
  default     = "localhost"
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "osia_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "osia_dev"
}

# -----------------------------------------------------------------------------
# Sector Secrets (for Vault storage)
# -----------------------------------------------------------------------------

variable "sector_secret_health" {
  description = "Health sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sector_secret_tax" {
  description = "Tax sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sector_secret_finance" {
  description = "Finance sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sector_secret_telco" {
  description = "Telco sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sector_secret_stats" {
  description = "Statistics sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sector_secret_education" {
  description = "Education sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sector_secret_social" {
  description = "Social sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sector_secret_government" {
  description = "Government sector HMAC secret"
  type        = string
  sensitive   = true
  default     = ""
}
