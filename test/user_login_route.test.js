// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/api/user/login", () => {
  let mockDb;

  const error = new Error("Test error");
  const userId = 1;
  const username = "Albert";
  const password = "test123";
  const getUserArgsMatch = sandBox.match({ values: [username] });

  const loginData = JSON.stringify({
    username,
    password,
  });

  beforeEach(() => {
    mockDb = sandBox.mock(db);
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("/user/login successful login", async () => {
    const defaultMaxAge = 86400;
    const refreshToken = "27a7c3b92385425199c6edfe771b24e3";
    const accessToken = "a529a756858f079b7859a246d90644b5";
    const hashedPassword = await bcrypt.hash(password, 10);
    // returns user's hashed password
    mockDb.expects("query").once().withArgs(getUserArgsMatch)
      .resolves({ rows: [{ id: userId, username, password: hashedPassword }] });

    const mockJWT = sandBox.mock(jwt);
    mockJWT.expects("sign").once().withArgs(
      { username, id: userId },
    ).returns(accessToken);
    mockJWT.expects("sign").once().withArgs(
      { username, id: userId },
    ).returns(refreshToken);

    // mock insert refresh token
    mockDb.expects("query").once().withArgs(sandBox.match({
      values: [refreshToken, defaultMaxAge],
    })).resolves({ rows: [{ id: 1 }] });

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("auth").eql(true);
    res.body.should.have.property("msg").eql("Logged in.");
    res.body.should.have.property("accessToken").eql(accessToken);
    res.body.should.have.property("refToken").eql(refreshToken);
    res.should.have.cookie("__authToken", accessToken);
    res.should.have.cookie("__refToken", refreshToken);

    sandBox.verify();
  });

  it("/user/login incorrect password fail login", async () => {
    mockDb.expects("query").once().withArgs(getUserArgsMatch)
      .resolves({ rows: [{ password }] });

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(401);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("auth").eql(false);
    res.body.should.have.property("msg").eql("Incorrect password.");

    sandBox.verify();
  });

  it("/user/login fail login user doesn't exist", async () => {
    mockDb.expects("query").once().withArgs(getUserArgsMatch).resolves({});

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(404);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("User does not exist.");

    sandBox.verify();
  });

  it("/user/login fail login db throws error", async () => {
    mockDb.expects("query").once().withArgs(getUserArgsMatch).throws(error);

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Internal server error.");

    sandBox.verify();
  });
});
