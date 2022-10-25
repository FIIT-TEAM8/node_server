const express = require("express");

const router = express.Router();

const dataRoute = require("./endpoints/data");
const userRoute = require("./endpoints/user");
const archiveRoute = require("./endpoints/archive");
const report = require("./endpoints/report");
const advancedSearch = require("./endpoints/advanced_search");

router.get("/", (req, res) => {
  res.status(200).json({ ok: true, data: {}, msg: "Default api route. Ok." });
});

// Define base routes here
router.use("/data", dataRoute);
router.use("/user", userRoute);
router.use("/archive", archiveRoute);
router.use("/report", report);
router.use("/advanced_search", advancedSearch);

module.exports = router;
