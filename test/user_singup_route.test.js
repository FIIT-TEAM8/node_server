// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/user/signup", () => {
  let mockDb;

  const error = new Error("Test error");
  const userId = 1;
  const username = "Albert";
  const password = "test123";
  const insertUserArgsMatch = sandBox.match({ values: [username, sandBox.match.any] });

  const singUpData = JSON.stringify({
    username,
    password,
  });

  beforeEach(() => {
    mockDb = sandBox.mock(db);
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("user already exists", async () => {
    // mock inspiration: https://sinonjs.org/releases/latest/mocks/#expectations
    mockDb.expects("query").once().withArgs(insertUserArgsMatch).resolves({});

    const res = await chai.request(server)
      .post("/api/user/signup")
      .send(singUpData)
      .set("Content-Type", "application/json");

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Sign up failed. Username might already be in use.");

    sandBox.verify();
  });

  it("successfull singup", async () => {
    const defaultMaxAge = 86400;
    const refreshToken = "27a7c3b92385425199c6edfe771b24e3";
    const accessToken = "a529a756858f079b7859a246d90644b5";

    // mock user insert and insert refresh token
    mockDb.expects("query").once().withArgs(insertUserArgsMatch).resolves({ rows: [{ id: 1 }] });

    const mockJWT = sandBox.mock(jwt);
    mockJWT.expects("sign").once().withArgs(
      { username, id: userId },
    ).returns(accessToken);
    mockJWT.expects("sign").once().withArgs(
      { username, id: userId },
    ).returns(refreshToken);

    mockDb.expects("query").once().withArgs(sandBox.match({
      values: [refreshToken, defaultMaxAge],
    })).resolves({ rows: [{ id: 1 }] });

    const res = await chai.request(server)
      .post("/api/user/signup")
      .send(singUpData)
      .set("Content-Type", "application/json");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("auth").eql(true);
    res.body.should.have.property("msg").eql("Sign up successful.");
    res.body.should.have.property("accessToken").eql(accessToken);
    res.body.should.have.property("refToken").eql(refreshToken);
    res.should.have.cookie("__authToken", accessToken);
    res.should.have.cookie("__refToken", refreshToken);

    sandBox.verify();
  });

  it("fail signup, throw execption", async () => {
    mockDb.expects("query").once().withArgs(insertUserArgsMatch).throws(error);

    const res = await chai.request(server)
      .post("/api/user/signup")
      .send(singUpData)
      .set("Content-Type", "application/json");

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Internal server error.");

    sandBox.verify();
  });
});
