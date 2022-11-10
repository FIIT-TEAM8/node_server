// '/data/*' endpoint

const express = require("express");
const dataApiTools = require("../../utils/data_api_tools");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ ok: true, data: {}, msg: "Data route is working" });
});

// node_host /ams/api/data/search/
router.get("/search/", async (req, res) => {
  try {
    const data = await dataApiTools.apiFetch("search", req);

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /search");
    return res.status(500).json({ ok: false, msg: "Forwarding request to /search failed." });
  }
});

router.get("/report", async (req, res) => {
  try {
    const data = await dataApiTools.apiFetch("report", req);

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /report");
    return res.status(500).json({ ok: false, msg: "Forwarding request to /report failed." });
  }
});

module.exports = router;
