const cron = require("node-cron");
const { clearOldRefreshTokens } = require("../db/token_db");

const setup = () => {
  // Runs every minute
  cron.schedule("* * * * *", () => {
    clearOldRefreshTokens();
    console.log("Token cleansing performed.");
  });
};

module.exports = {
  setup,
};
