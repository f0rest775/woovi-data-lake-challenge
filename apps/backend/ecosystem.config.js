module.exports = {
  apps: [
    {
      name: "payments-backend",
      script: "dist/server.js",
      instances: "max",
      exec_mode: "cluster",
    },
  ],
};
