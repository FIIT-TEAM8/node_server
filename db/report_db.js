const db = require("./postgres");

async function getReport(userId, status) {
  const query = {
    text: "SELECT * FROM public.pdf_report WHERE user_id = $1 AND status = $2",
    values: [userId, status],
  };
  const result = await db.query(query);
  if (result.rows && result.rows[0]) {
    return result.rows[0];
  }
  return null;
}

async function insertReport(userId, reportContent) {
  const query = {
    text: "INSERT INTO public.pdf_report (content, user_id) VALUES ($1, $2) RETURNING id",
    values: [reportContent, userId],
  };
  const result = await db.query(query);
  if (result.rows && result.rows[0]) {
    return result.rows[0].id;
  }
  return null;
}

async function updateReport(reportId, report) {
  const query = {
    text: "UPDATE public.pdf_report SET content = $1 WHERE id = $2",
    values: [report, reportId],
  };
  const result = await db.query(query);

  // rowCount informs about number of updated records
  if (result.rowCount !== 0) {
    return result.rowCount;
  }
  return null;
}

module.exports = {
  getReport,
  insertReport,
  updateReport,
};
