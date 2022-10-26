const express = require("express");
const compression = require("compression");
const cookieParser = require("cookie-parser");

const { debug } = require("console");
const routes = require("./routes/routes");
const { cfg } = require("./config");
const db = require("./db/postgres");

const cron = require("./utils/cron");
const { attachUser } = require("./middleware/auth");

// Start up connection to DB
db.getPool();

cron.setup();

const app = express();

app.use(compression());

if (process.env.NODE_ENV !== "production") {
  console.log("Running a DEVELOPMENT server");
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-Width, Content-Type, Accept, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS, PUT");
    next();
  });
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(attachUser, async (req, res, next) => {
    // Database demo
    const query = {
      text: "SELECT NOW() AS now",
      values: [],
    };

    const result = await db.query(query);
    debug(`${result.rows[0].now} New request: ${req.url} From user: ${req.body.user && req.body.user.username}`);
    next();
  });
}

// Define version routes here
app.use("/api/", routes);

app.listen(cfg.APP_PORT, () => console.log(`Listening on port ${cfg.APP_PORT}`));
