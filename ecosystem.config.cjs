/**
 * PM2 Ecosystem Configuration for OSIA UIN Generator
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs --only osia-uin-generator-dev
 *   pm2 stop osia-uin-generator-dev
 *   pm2 restart osia-uin-generator-dev
 *   pm2 logs osia-uin-generator-dev
 *   pm2 delete osia-uin-generator-dev
 */

// Read Vault token from file (same pattern as myid-hsm, unified-middleware)
const VAULT_TOKEN = (() => {
  try { return require('fs').readFileSync('/run/vault/token', 'utf8').trim(); }
  catch { return ''; }
})();

module.exports = {
  apps: [
    {
      name: 'osia-uin-generator-web',
      script: 'npm',
      args: 'run preview',
      cwd: './web',
      instances: 1,
      exec_mode: 'fork',

      // Environment variables
      env: {
        NODE_ENV: 'production'
      },

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',

      // Restart on errors
      min_uptime: '10s',
      max_restarts: 10,

      // Logging
      error_file: './web/logs/err.log',
      out_file: './web/logs/out.log',
      log_file: './web/logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs from different instances
      merge_logs: true,

      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    },
    {
      name: 'osia-uin-generator-dev',
      script: './src/server.mjs',
      instances: 1,
      exec_mode: 'fork',

      // Interpreter (uses system Node.js)
      interpreter: 'node',

      // Environment variables for development
      env: {
        NODE_ENV: 'development',

        // Server configuration
        PORT: 19020,
        HOST: '0.0.0.0',

        // TLS - required for Vault self-signed cert (must be set at fork spawn)
        NODE_EXTRA_CA_CERTS: '/etc/ssl/certs/vault-ca.crt',

        // UIN configuration
        UIN_DEFAULT_CHARSET: 'A-Z0-9',
        UIN_DEFAULT_LENGTH: 19,
        UIN_DEFAULT_MODE: 'foundational',
        UIN_CHECKSUM_ALGORITHM: 'iso7064',

        // Supported sectors
        UIN_SUPPORTED_SECTORS: 'health,tax,finance,telco,stats,education,social,government',

        // Sector secrets (DEV ONLY - DO NOT USE IN PRODUCTION)
        // In production these come from Vault (osia/sector-secrets)
        SECTOR_SECRET_HEALTH: 'dev-secret-health-DO-NOT-USE-IN-PRODUCTION',
        SECTOR_SECRET_TAX: 'dev-secret-tax-DO-NOT-USE-IN-PRODUCTION',
        SECTOR_SECRET_FINANCE: 'dev-secret-finance-DO-NOT-USE-IN-PRODUCTION',
        SECTOR_SECRET_TELCO: 'dev-secret-telco-DO-NOT-USE-IN-PRODUCTION',
        SECTOR_SECRET_STATS: 'dev-secret-stats-DO-NOT-USE-IN-PRODUCTION',
        SECTOR_SECRET_EDUCATION: 'dev-secret-education-DO-NOT-USE-IN-PRODUCTION',
        SECTOR_SECRET_SOCIAL: 'dev-secret-social-DO-NOT-USE-IN-PRODUCTION',
        SECTOR_SECRET_GOVERNMENT: 'dev-secret-government-DO-NOT-USE-IN-PRODUCTION',

        // CORS configuration
        UIN_ENABLE_CORS: 'true',
        UIN_CORS_ORIGIN: '*',

        // Logging
        LOG_LEVEL: 'info',

        // Database configuration
        DB_HOST: '172.27.104.111',
        DB_PORT: '5432',
        DB_USER: 'postgres',
        DB_PASSWORD: '',
        DB_NAME: 'osia_dev',

        // HSM configuration (SoftHSM2 for local PKCS#11 key storage)
        HSM_ENABLED: 'true',
        HSM_PROVIDER: 'softhsm',
        HSM_LIBRARY: '/usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so',
        HSM_SLOT: '0',
        HSM_PIN: '1234',
        HSM_KEY_LABEL: 'osia-sector-key',

        // Remote TRNG (Utimaco CryptoServer c3 via pkcs11-tool-remote SSH)
        TRNG_ENABLED: 'true',
        TRNG_SLOT: '5',
        // PIN loaded from Vault (osia/hsm -> trng_pin) at runtime;
        // env fallback only used if Vault is unavailable
        TRNG_PIN: '',

        // Vault configuration (nv2 Vault via ZeroTier)
        VAULT_ENABLED: 'true',
        VAULT_ADDR: 'https://172.27.170.210:8200',
        VAULT_SKIP_VERIFY: '1',
        VAULT_TOKEN: VAULT_TOKEN,
      },

      // Environment variables for production
      env_production: {
        NODE_ENV: 'production',

        // Server configuration
        PORT: 19020,
        HOST: '127.0.0.1',

        // TLS
        NODE_EXTRA_CA_CERTS: '/etc/ssl/certs/vault-ca.crt',

        // UIN configuration
        UIN_DEFAULT_CHARSET: 'A-Z0-9',
        UIN_DEFAULT_LENGTH: 19,
        UIN_DEFAULT_MODE: 'foundational',
        UIN_CHECKSUM_ALGORITHM: 'iso7064',

        // Supported sectors
        UIN_SUPPORTED_SECTORS: 'health,tax,finance,telco,stats,education,social,government',

        // IMPORTANT: In production, sector secrets come from Vault
        // Do NOT use the dev secrets in production!

        // CORS configuration (restrict in production)
        UIN_ENABLE_CORS: 'true',
        UIN_CORS_ORIGIN: 'https://uin-generator.app',

        // Logging
        LOG_LEVEL: 'warn',

        // Vault
        VAULT_ENABLED: 'true',
        VAULT_ADDR: 'https://172.27.170.210:8200',
        VAULT_SKIP_VERIFY: '1',
        VAULT_TOKEN: VAULT_TOKEN,

        // HSM
        HSM_ENABLED: 'true',
        TRNG_ENABLED: 'true',
        TRNG_SLOT: '5',
      },

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // Restart on errors
      min_uptime: '10s',
      max_restarts: 10,

      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs from different instances
      merge_logs: true,

      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    }
  ]
};
