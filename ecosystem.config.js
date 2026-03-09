export const apps = [
  {
    // Main API Server
    name: "kemet-api",
    script: "./dist/server.js", // Fixed: point to src/server.js
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
    },
    // Restart policies
    max_memory_restart: "500M",
    watch: false,
    ignore_watch: ["node_modules", "logs", "dist"],

    // Logs
    out_file: "./logs/kemet-api.log",
    err_file: "./logs/kemet-api-error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",

    // Auto restart settings
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s",

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
  },
];
export const deploy = {
  production: {
    user: "node",
    host: "your-production-host",
    ref: "origin/main",
    repo: "your-git-repo-url",
    path: "/var/www/kemet-backend",
    "post-deploy":
      "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
  },
};
export const preset = "ts-jest";
export const testEnvironment = "node";
export const transform = {
  "^.+\\.tsx?$": "ts-jest",
  "^.+\\.jsx?$": "ts-jest",
};
export const transformIgnorePatterns = ["node_modules/(?!(@faker-js)/)"];
