module.exports = {
  apps: [
    {
      name: "Anushthan-API",
      script: "./dist/index.js",
      instances: "max",           // Use all available cores
      exec_mode: "cluster",       // Run in cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      }
    },
    {
      name: "Anushthan-Worker",
      script: "./dist/bullmq/runAllWorkers.js",
      instances: 1,               // Usually workers run in a single instance
      exec_mode: "fork",          // Worker usually doesn't need clustering
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
