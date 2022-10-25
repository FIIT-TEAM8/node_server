const db = require("./postgres");

async function checkRefreshToken(token) {
  const query = {
    text: "UPDATE public.refresh_token SET last_access = now() WHERE token = $1 RETURNING max_age_seconds as maxage",
    values: [token],
  };
  const result = await db.query(query);

  if (result.rows.length === 1) {
    return result.rows[0].maxage;
  }
  return null;
}

async function insertRefreshToken(token, maxAge) {
  const query = {
    text: "INSERT INTO public.refresh_token (token, max_age_seconds) VALUES ($1, $2) RETURNING id",
    values: [token, maxAge],
  };
  const result = await db.query(query);
  if (result.rows && result.rows[0]) {
    return result.rows[0].id;
  }
  return null;
}

async function deleteRefreshToken(token) {
  const query = { text: "DELETE FROM public.refresh_token WHERE token = $1", values: [token] };
  await db.query(query);
}

async function clearOldRefreshTokens() {
  const query = {
    text: "DELETE FROM public.refresh_token WHERE EXTRACT(EPOCH FROM (now() - refresh_token.last_access)) > refresh_token.max_age_seconds;",
  };
  await db.query(query);
}

module.exports = {
  checkRefreshToken,
  insertRefreshToken,
  deleteRefreshToken,
  clearOldRefreshTokens,
};
