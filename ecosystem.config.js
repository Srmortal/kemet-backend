module.exports = {
  apps: [
    {
      // Main API Server
      name: 'kemet-api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Restart policies
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Logs
      out_file: './logs/kemet-api.log',
      err_file: './logs/kemet-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart settings
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
    },
    
    {
      // Experience Egypt Scraper (runs on schedule)
      name: 'scraper-egypt',
      script: './dist/scripts/scrape-experienceegypt.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      // Run every day at 2 AM
      cron_restart: '0 2 * * *',
      autorestart: false,
      
      out_file: './logs/scraper-egypt.log',
      err_file: './logs/scraper-egypt-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    
    {
      // Tourism Activities Scraper (runs on schedule)
      name: 'scraper-tourism',
      script: './dist/scripts/scrape-tourism.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      // Run every 3 days at 3 AM
      cron_restart: '0 3 */3 * *',
      autorestart: false,
      
      out_file: './logs/scraper-tourism.log',
      err_file: './logs/scraper-tourism-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    
    {
      // Booking Accommodations Scraper (runs on schedule)
      name: 'scraper-booking',
      script: './dist/scripts/scrape-booking.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      // Run every 7 days at 4 AM
      cron_restart: '0 4 */7 * *',
      autorestart: false,
      
      out_file: './logs/scraper-booking.log',
      err_file: './logs/scraper-booking-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-production-host',
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/var/www/kemet-backend',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
