const db = require("./postgres");

async function getUser(username) {
  const query = {
    text: "SELECT * FROM public.user WHERE username = $1",
    values: [username],
  };
  const result = await db.query(query);
  if (result.rows && result.rows[0]) {
    return result.rows[0];
  }
  return null;
}

async function insertUser(user) {
  const query = {
    text: "INSERT INTO public.user (username, password) VALUES ($1, $2) RETURNING id",
    values: [user.username, user.password],
  };
  const result = await db.query(query);
  if (result.rows && result.rows[0]) {
    return result.rows[0].id;
  }
  return null;
}

module.exports = {
  getUser,
  insertUser,
};
