/**
 * PM2 Ecosystem Configuration
 * 
 * Production process management configuration
 */

module.exports = {
  apps: [
    {
      name: 'quantumbilling-api',
      script: './dist/server.js',
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Resource management
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      
      // Advanced features
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs', 'dist'],
      watch_delay: 1000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Source maps for better error traces
      source_map_support: true,
      
      // Environment-specific overrides
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
      },
    },
    {
      name: 'quantumbilling-workers',
      script: './dist/workers/index.js',
      instances: 2, // Run 2 worker processes
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      
      // Resource management
      max_memory_restart: '800M',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/workers-error.log',
      out_file: './logs/workers-out.log',
      merge_logs: true,
      
      // Graceful shutdown
      kill_timeout: 30000, // Workers need more time to finish jobs
      wait_ready: false,
      
      // Cron restart (optional - restart workers daily)
      cron_restart: '0 3 * * *', // 3 AM daily
      
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'quantumbilling-temporal-worker',
      script: './dist/workers/dunning.worker.js',
      instances: 1, // Single worker for Temporal (Temporal handles concurrency)
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      
      // Resource management
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/temporal-worker-error.log',
      out_file: './logs/temporal-worker-out.log',
      merge_logs: true,
      
      // Graceful shutdown
      kill_timeout: 30000, // Temporal workers need time to finish workflows
      wait_ready: false,
      
      env_production: {
        NODE_ENV: 'production',
      },
    },

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/quantumbilling-backend.git',
      path: '/var/www/quantumbilling',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production..."',
      'post-deploy-local': 'echo "Production deployment complete"',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/quantumbilling-backend.git',
      path: '/var/www/quantumbilling-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
