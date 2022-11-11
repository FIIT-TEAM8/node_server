const jwt = require("jsonwebtoken");
const { debug } = require("../utils/logging");
const { getUser } = require("../db/user_db");
const { checkRefreshToken } = require("../db/token_db");
const { cfg } = require("../config");

// https://www.youtube.com/watch?v=mbsmsi7l3r4&ab_channel=WebDevSimplified auth
function generateAccessToken(data) {
  return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" });
}

// eslint-disable-next-line consistent-return
async function refreshToken(req, res, next) {
  const refToken = req.cookies.__refToken;

  console.log(refToken);

  if (!refToken) {
    return res.sendStatus(401);
  }

  const refreshTokenMaxAge = await checkRefreshToken(refToken);
  if (!refreshTokenMaxAge) {
    return res.sendStatus(403);
  }

  try {
    const user = jwt.verify(refToken, process.env.REFRESH_TOKEN_SECRET);

    const accessToken = generateAccessToken({ username: user.username, id: user.id });
    res.cookie("__authToken", accessToken, { maxAge: cfg.AUTH_COOKIE_AGE, httpOnly: true, secure: cfg.IS_HTTPS });
    res.cookie("__refToken", refToken, { maxAge: refreshTokenMaxAge * 1000, httpOnly: false, secure: cfg.IS_HTTPS });

    debug(`Authenticated: ${user.username}`);
    delete user.iat;
    req.body.user = user; // required???

    next();
  } catch (err) {
    console.log(err);
    return res.sendStatus(403);
  }
}

function authenticateUser(req, res, next) {
  // const authHeader = req.headers['authorization']
  // const token = authHeader && authHeader.split(' ')[1]
  const token = req.cookies.__authToken;
  if (!token) {
    return res.sendStatus(401);
  }

  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    debug(`Authenticated: ${user.username}`);
    req.body.user = user;
    return next();
  });
}

// If a user is logged in, the data will be in req.body.user
function attachUser(req, res, next) {
  const token = req.cookies.__authToken;
  if (!token) {
    return next();
  }

  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      return refreshToken(req, res, next);
    }
    debug(`Authenticated: ${user.username}`);
    const dbuser = await getUser(user.username);
    delete dbuser.password;
    req.body.user = dbuser;
    return next();
  });
}

module.exports = {
  authenticateUser,
  attachUser,
  generateAccessToken,
  refreshToken,
};
