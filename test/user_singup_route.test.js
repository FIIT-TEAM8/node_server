// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/user/signup", () => {
  let mockDb;

  const error = new Error("Test error");
  const username = "Albert";
  const password = "test123";

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
    // source: documentation https://sinonjs.org/releases/latest/mocks/#expectations
    mockDb.expects("query").once().resolves({});

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
    // mock user insert and insert refresh token
    mockDb.expects("query").twice().resolves({ rows: [{ id: 1 }] });

    const res = await chai.request(server)
      .post("/api/user/signup")
      .send(singUpData)
      .set("Content-Type", "application/json");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("auth").eql(true);
    res.body.should.have.property("msg").eql("Sign up successful.");
    res.body.should.have.property("accessToken");
    res.body.should.have.property("refToken");

    sandBox.verify();
  });

  it("fail signup, throw execption", async () => {
    mockDb.expects("query").once().throws(error);

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
