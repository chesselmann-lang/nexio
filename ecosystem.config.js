// PM2 Ecosystem Config — Mittwald mStudio Deployment
module.exports = {
  apps: [
    {
      name: "nexio",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/home/[MITTWALD_USER]/html/nexio",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
