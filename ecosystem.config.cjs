/**
 * PM2 Ecosystem Configuration for OSIA UIN Generator
 *
 * Usage:
 *   # Start all services (API + Web UI)
 *   pm2 start ecosystem.config.cjs
 *
 *   # Start only API server
 *   pm2 start ecosystem.config.cjs --only osia-uin-api-dev
 *
 *   # Start only Web UI
 *   pm2 start ecosystem.config.cjs --only osia-uin-web-dev
 *
 *   # Stop all
 *   pm2 stop ecosystem.config.cjs
 *
 *   # View logs
 *   pm2 logs
 *   pm2 logs osia-uin-api-dev
 *   pm2 logs osia-uin-web-dev
 *
 *   # Delete all
 *   pm2 delete ecosystem.config.cjs
 */

module.exports = {
  apps: [
    // Backend API Service
    {
      name: 'osia-uin-api-dev',
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

        // UIN configuration
        UIN_DEFAULT_CHARSET: 'A-Z0-9',
        UIN_DEFAULT_LENGTH: 19,
        UIN_DEFAULT_MODE: 'foundational',
        UIN_CHECKSUM_ALGORITHM: 'iso7064',

        // Supported sectors
        UIN_SUPPORTED_SECTORS: 'health,tax,finance,telco,stats,education,social,government',

        // Sector secrets (DEV ONLY - DO NOT USE IN PRODUCTION)
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

        // Database configuration (PostgreSQL)
        OSIA_DB_HOST: process.env.PGHOST ,
        OSIA_DB_PORT: process.env.PGPORT || 5432,
        OSIA_DB_USER: process.env.PGUSER ,
        OSIA_DB_PASSWORD: process.env.PGPASSWORD ,
        OSIA_DB_NAME: 'osia_dev',

        // Logging
        LOG_LEVEL: 'info'
      },

      // Environment variables for production
      env_production: {
        NODE_ENV: 'production',

        // Server configuration
        PORT: 19020,
        HOST: '0.0.0.0',

        // UIN configuration
        UIN_DEFAULT_CHARSET: 'A-Z0-9',
        UIN_DEFAULT_LENGTH: 19,
        UIN_DEFAULT_MODE: 'foundational',
        UIN_CHECKSUM_ALGORITHM: 'iso7064',

        // Supported sectors
        UIN_SUPPORTED_SECTORS: 'health,tax,finance,telco,stats,education,social,government',

        // IMPORTANT: In production, sector secrets MUST be provided via environment
        // or secure secret management (Vault, AWS Secrets Manager, etc.)
        // Do NOT use the dev secrets in production!

        // CORS configuration (restrict in production)
        UIN_ENABLE_CORS: 'true',
        UIN_CORS_ORIGIN: 'https://your-domain.com',

        // Database configuration (PostgreSQL)
        // IMPORTANT: In production, set these via environment or secure secret management
        OSIA_DB_HOST: process.env.PGHOST || process.env.OSIA_DB_HOST ,
        OSIA_DB_PORT: process.env.PGPORT || process.env.OSIA_DB_PORT || 5432,
        OSIA_DB_USER: process.env.PGUSER || process.env.OSIA_DB_USER ,
        OSIA_DB_PASSWORD: process.env.PGPASSWORD || process.env.OSIA_DB_PASSWORD ,
        OSIA_DB_NAME: process.env.OSIA_DB_NAME || 'osia_dev',

        // Logging
        LOG_LEVEL: 'warn'
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
    },

    // React Web UI Service
    {
      name: 'osia-uin-web-dev',
      script: 'npm',
      args: 'run preview',
      cwd: './web',
      instances: 1,
      exec_mode: 'fork',

      // Environment variables
      env: {
        NODE_ENV: 'development'
      },

      env_production: {
        NODE_ENV: 'production'
      },

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      // Restart on errors
      min_uptime: '10s',
      max_restarts: 10,

      // Logging
      error_file: './logs/web-err.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs
      merge_logs: true,

      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    }
  ]
};
