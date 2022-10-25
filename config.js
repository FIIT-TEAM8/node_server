// ENV variables can be loaded by creating a local .env file
// The variables are loaded automatically using the following command
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "../dev/env/postgres_db.env" }); // load from ./postgres_db.env
  // dotenv.config({path: `../dev/env/node.env`})
  dotenv.config(); // load and override from ./.env
}

// These need to be either loaded in the docker or from a copied postgres_db.env file
const dbCfg = {
  POSTGRES_USER: process.env.POSTGRES_USER || "postgres",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "postgres",
  POSTGRES_DB: process.env.POSTGRES_DB || "ams",
  POSTGRES_HOST: process.env.POSTGRES_HOST || "postgres_db",
  POSTGRES_PORT: process.env.POSTGRES_PORT || 5432,
};

// Basic config (all variables are recommended to be left at default)
const cfg = {
  APP_PORT: process.env.REACT_APP_PORT || 8080,
  IS_HTTPS: process.env.IS_HTTPS || true,
  COOKIE_AGE: process.env.COOKIE_AGE || 1000 * 60 * 60 * 24 * 30, // 30 days,
  AUTH_COOKIE_AGE: process.env.AUTH_COOKIE_AGE || 1000 * 60 * 2, // 2 MINUTES,
  BUILD_PATH: process.env.BUILD_PATH || "../frontend/build",
  DATA_API_HOST: process.env.DATA_API_HOST || "http://flask_server:5000",
  DATA_API_VERSION: process.env.DATA_API_VERSION || "v3",
  USE_SERVER_PUBLIC_URL: process.env.USE_SERVER_PUBLIC_URL || false,
};

if (cfg.USE_SERVER_PUBLIC_URL === "true" || cfg.USE_SERVER_PUBLIC_URL === true) {
  cfg.PUBLIC_URL = process.env.PUBLIC_URL || "/ams";
} else {
  cfg.PUBLIC_URL = "";
}

// Modified config for development/test (not production)
if (process.env.NODE_ENV !== "production") {
  cfg.DATA_API_HOST = process.env.DEV_DATA_API_HOST || "https://localhost:5000/api";
  cfg.IS_HTTPS = process.env.IS_HTTPS || false;
}

console.log("Using config:");
console.log(cfg);
if (process.env.NODE_ENV !== "production") {
  console.log(dbCfg);
}

module.exports = {
  cfg,
  dbCfg,
};
