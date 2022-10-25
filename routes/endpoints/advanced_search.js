// '/data/*' endpoint

const express = require("express");
const fetch = require("node-fetch");
const { cfg } = require("../../config");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ ok: true, data: {}, msg: "Advancer search route is working" });
});

async function apiFetch(endpoint, req) {
  const version = req.query.version || cfg.DATA_API_VERSION;
  const url = `${cfg.DATA_API_HOST}/${version}/${endpoint}`;
  const response = await fetch(url);
  const json = response.json();
  return json;
}

// node_host /ams/api/advanced_search/keyword_categories
router.get("/keyword_categories", async (req, res) => {
  try {
    const data = await apiFetch("keyword_categories", req);

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /keyword_categories");
    return res.status(500).json({ ok: false, msg: "Something went wrong while forwarding the request" });
  }
});

router.get("/region_mapping", async (req, res) => {
  try {
    const data = await apiFetch("region_mapping", req);

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /keyword_categories");
    return res.status(500).json({ ok: false, msg: "Something went wrong while forwarding the request" });
  }
});

module.exports = router;
