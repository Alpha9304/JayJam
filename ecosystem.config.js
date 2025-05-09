module.exports = {
  apps: [
    {
      name: process.env.ENV === "production" ? "frontend-prod" : "frontend-dev",
      script: "pnpm",
      args: "start",
      cwd: "./apps/client",
      interpreter: "none",
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.FRONTEND_PORT || 3000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: process.env.FRONTEND_PORT || 3002,
      },
    },
    {
      name: process.env.ENV === "production" ? "backend-prod" : "backend-dev",
      script: "pnpm",
      args: "start",
      cwd: "./apps/server",
      interpreter: "none",
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.BACKEND_PORT || 4000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: process.env.BACKEND_PORT || 4002,
      },
    },
  ],
};
