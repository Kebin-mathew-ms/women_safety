module.exports = {
  apps: [
    {
      name: 'safe-travel-backend',
      script: './dist/server.js',
      instances: 'max', // Clustered mode based on CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        SOCKET_PORT: 5001,
        DATABASE_URL: 'mysql://root:root@localhost:3306/women',
        JWT_SECRET: 'production_secret_override_me',
        ADMIN_JWT_SECRET: 'production_admin_secret_override_me',
        UPLOAD_PATH: 'uploads',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
