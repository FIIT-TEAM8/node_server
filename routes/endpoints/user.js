// '/user/*' endpoint
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const { cfg } = require("../../config");
const { debug, errLog } = require("../../utils/logging");
const userdb = require("../../db/user_db");
const tokendb = require("../../db/token_db");
const { generateAccessToken, refreshToken } = require("../../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ ok: true, data: {}, msg: "Default user route is working" });
});

router.post("/signup", async (req, res) => {
  const cookieAge = req.body.maxCookieAge || 60 * 60 * 24; // 1 day default (60s * 60m * 24h)

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { username: req.body.username, password: hashedPassword };
    const id = await userdb.insertUser(user);
    if (!id) {
      return res.status(400).json({ ok: false, msg: "Sign up failed. Username might already be in use." });
    }
    const accessToken = generateAccessToken({ username: user.username, id });
    const refToken = jwt.sign(
      { username: user.username, id },
      process.env.REFRESH_TOKEN_SECRET,
    );
    tokendb.insertRefreshToken(refToken, cookieAge);

    // @ts-ignore
    res.cookie("__authToken", accessToken, { maxAge: cfg.AUTH_COOKIE_AGE, httpOnly: true, secure: cfg.IS_HTTPS });
    // @ts-ignore
    res.cookie("__refToken", refToken, { maxAge: cookieAge * 1000, httpOnly: false, secure: cfg.IS_HTTPS });
    return res.status(200).json({
      ok: true,
      auth: true,
      msg: "Sign up successful.",
      accessToken,
      refToken,
    });
  } catch (e) {
    errLog(e.stack);
    return res.status(500).json({ ok: false, msg: "Internal server error." });
  }
});

router.post("/login", async (req, res) => {
  const user = await userdb.getUser(req.body.username);
  const cookieAge = req.body.maxCookieAge || 60 * 60 * 24; // 1 day default (60s * 60m * 24h)
  debug(`REF_COOKIE_AGE: ${cookieAge}`);
  debug(`AUTH_COOKIE_AGE: ${cfg.AUTH_COOKIE_AGE}`);
  if (!user) {
    return res.status(404).json({ ok: false, auth: false, msg: "User does not exist." });
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = generateAccessToken({ username: user.username, id: user.id });
      const refToken = jwt.sign(
        { username: user.username, id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
      );

      tokendb.insertRefreshToken(refToken, cookieAge);

      // @ts-ignore
      res.cookie("__authToken", accessToken, { maxAge: cfg.AUTH_COOKIE_AGE, httpOnly: true, secure: cfg.IS_HTTPS });
      // @ts-ignore
      res.cookie("__refToken", refToken, { maxAge: cookieAge * 1000, httpOnly: false, secure: cfg.IS_HTTPS });
      return res.status(200).json({
        ok: true,
        auth: true,
        msg: "Logged in.",
        accessToken,
        refToken,
      });
    }

    return res.status(401).json({ ok: false, auth: false, msg: "Incorrect password." });
  } catch (e) {
    errLog(e.stack);
    return res.status(500).json({ ok: false, msg: "Internal server error." });
  }
});

router.get("/token", refreshToken, async (req, res) => {
  res.status(200).json({ ok: true });
});

router.post("/logout", async (req, res) => {
  try {
    await tokendb.deleteRefreshToken(req.cookies.__refToken);
    return res.status(200).json({ ok: true, msg: "Log out successful." });
  } catch (e) {
    errLog(e.stack);
    return res.status(500).json({ ok: false, msg: "Internal server error." });
  }
});

module.exports = router;
