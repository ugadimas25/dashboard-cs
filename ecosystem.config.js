module.exports = {
  apps: [{
    name: 'farmforce-dashboard',
    script: 'dist/index.cjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Restart strategy
    min_uptime: '10s',
    max_restarts: 10,
    // Advanced features
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // Source map support
    source_map_support: true,
    // Environment dari .env file
    env_file: '.env'
  }]
};
