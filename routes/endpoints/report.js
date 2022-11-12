const express = require("express");
const DOMPurify = require("isomorphic-dompurify");
const htmlToPdf = require("html-pdf-node");
const reportDb = require("../../db/report_db");
const dataApiTools = require("../../utils/data_api_tools");
const { authenticateUser } = require("../../middleware/auth");

const htmlSanitizeOptions = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "h1", "h2", "h3", "h4", "h5", "h6", "p", "span"],
  ALLOWED_ATTR: ["href"],
};

const sanitize = (dirty, options) => ({
  __html: DOMPurify.sanitize(dirty, { ...htmlSanitizeOptions, ...options }),
});

const pdfOptions = {
  format: "A4",
  margin: {
    top: "45px",
    bottom: "45px",
    left: "65px",
    right: "65px",
  },
  printBackground: true,
};

const router = express.Router();

// node_host /ams/api/report/create/:user_id
router.post("/create", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.body;
    const reportContent = JSON.stringify(req.body.articlesInReport); // convert array to json for db

    const id = await reportDb.insertReport(userId, reportContent);
    if (!id) {
      return res.status(400).json({ ok: false, msg: "Creation of report failed." });
    }

    return res.status(200).json({ ok: true, reportId: id, msg: "Report was successfully created." });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /report/add");
    return res.status(500).json({ ok: false, msg: "Unable to create report." });
  }
});

// node_host /ams/api/report/update/:id
router.post("/update/:id", authenticateUser, async (req, res) => {
  try {
    const reportId = req.params.id;
    const reportContent = JSON.stringify(req.body.articlesInReport); // convert array to json for db

    const result = await reportDb.updateReport(reportId, reportContent);
    if (!result) {
      return res.status(400).json({ ok: false, msg: "Something failed while updating report." });
    }

    return res.status(200).json({ ok: true, msg: "Report was succesfully updated." });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /report/update/:id");
    return res.status(500).json({ ok: false, msg: "Unable to update report." });
  }
});

router.post("/download", authenticateUser, async (req, res) => {
  try {
    if (!("body" in req && "articlesIds" in req.body && "articlesSearchTerms" in req.body)) {
      return res.status(400).json({ ok: false, msg: "Wrong request, missing articles ids or search terms." });
    }

    const { articlesIds, articlesSearchTerms } = req.body;
    const data = await dataApiTools.fetchArticles("report", req, articlesIds);

    if (!data || !("results" in data)) {
      return res.status(500).json({ ok: false, msg: "Articles wasn't recieved from API server." });
    }

    let reportHtml = "";
    const articles = data.results;

    for (let i = 0; i < articles.length; i += 1) {
      const article = articles[i];

      if ("html" in article) {
        let sanitizedHTML = sanitize(articles[i].html, htmlSanitizeOptions).__html;
        const htmlLower = sanitizedHTML.toLowerCase();

        const searchTerm = articlesSearchTerms[i];
        reportHtml += `<h4>Article was found by term: <span style="background-color:yellow;">${searchTerm}</span></h4>`;
        reportHtml += `<h5>Source: <a href="${article.link}">${article.link}</a></h5>`;

        // get all starting indexes, where search term was found in article's sanitized html
        const startIndexes = [...htmlLower.matchAll(searchTerm)].map((result) => result.index);

        const searchTermLength = searchTerm.length;
        const totalSpanLength = "<span style=\"background-color:yellow;\"></span>".length;

        for (let j = 0; j < startIndexes.length; j += 1) {
          // shift of startIndex is required, because some searchTerms in sanitizedHtml
          // could be already surrounded by span with background style
          const startIndex = startIndexes[j] + j * totalSpanLength;
          const endIndex = startIndex + searchTermLength;

          const startHtml = sanitizedHTML.slice(0, startIndex);
          const searchTermHtml = sanitizedHTML.slice(startIndex, endIndex);
          const endHtml = sanitizedHTML.slice(endIndex);

          sanitizedHTML = `${startHtml}<span style="background-color:yellow;">${searchTermHtml}</span>${endHtml}`;
        }

        reportHtml += sanitizedHTML;
        reportHtml += "<br><div style=\"page-break-after:always;\"></div>"; // page break, https://github.com/marcbachmann/node-html-pdf/issues/49 (page breaks or merge)
      }
    }

    const file = { content: reportHtml };
    const pdfBuffer = await htmlToPdf.generatePdf(file, pdfOptions).then((pdfBuff) => pdfBuff);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    return res.end(Buffer.from(pdfBuffer, "base64")); // new Buffer.from()
  } catch (e) {
    console.log(e);
    console.log("Exception happend while handling: /report/download");
    return res.status(500).json({ ok: false, msg: "Unable to generate PDF from articles in report." });
  }
});

// node_host /ams/api/report/:id?status=In Progres
// get report based on user_id and report status
router.get("/:user_id", authenticateUser, async (req, res) => {
  try {
    const userId = req.params.user_id;
    const reportStatus = ("status" in req.query) ? req.query.status : "In Progress";

    // database will return only first user's report with wanted status
    const report = await reportDb.getReport(userId, reportStatus);
    if (!report) {
      return res.status(400).json({ ok: false, msg: "Unable to retrieve report." });
    }

    return res.status(200).json({
      ok: true, reportId: report.id, articlesInReport: report.content, msg: "Report was successfully retrieved.",
    });
  } catch (e) {
    console.log(e);
    console.log("Exception happened while handling: /report/:id");
    return res.status(500).json({ ok: false, msg: "Unable to retrieve report." });
  }
});

module.exports = router;
