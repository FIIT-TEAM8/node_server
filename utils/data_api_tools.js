const fetch = require("node-fetch");
const { cfg } = require("../config");

function extractQueryString(req) {
  const { query } = req;
  return `?${Object.keys(query)
    .map((key) => `${key}=${query[key]}`)
    .join("&")}`;
}

async function apiFetch(endpoint, req) {
  const version = req.query.version || cfg.DATA_API_VERSION;
  const url = `${cfg.DATA_API_HOST}/${version}/${endpoint}${extractQueryString(req)}`;
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

async function fetchArticles(endpoint, req, articleIds) {
  const version = req.query.version || cfg.DATA_API_VERSION;
  const url = `${cfg.DATA_API_HOST}/${version}/${endpoint}?ids=[${articleIds.join(", ")}]`;
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

module.exports = {
  apiFetch,
  fetchArticles,
};
