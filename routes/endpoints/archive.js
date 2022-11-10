// '/archive/*' endpoint

const express = require("express");
const { apiFetch } = require("../../utils/data_api_tools");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ ok: true, data: {}, msg: "Archive route is working" });
});

// node_host /ams/api/data/search/
router.get("/search/", async (req, res) => {
  try {
    const { link } = req.query;

    let data = {};

    if (link && link !== "null") {
      data = await apiFetch("archive", req);
    } else {
      return res.status(400).json({ ok: false, msg: "No search parameters provided." });
    }

    return res.status(200).json({ ok: true, msg: "Data sent.", data: data.article });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /archive/search");
    return res.status(500).json({ ok: false, msg: "The requested article could not be found." });
  }
});

module.exports = router;
