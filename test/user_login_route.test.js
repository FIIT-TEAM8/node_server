// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const bcrypt = require("bcrypt");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

const error = new Error("Test error");
const username = "Albert";
const password = "test123";

describe("/user/login", () => {
  let mockDb;

  const loginData = JSON.stringify({
    username,
    password,
  });

  beforeEach(() => {
    sandBox.restore();
    mockDb = sandBox.mock(db);
  });

  it("succesfull login", async () => {
    const hashedPassword = await bcrypt.hash(password, 10).then();
    // returns user's hashed password
    mockDb.expects("query").once().resolves({ rows: [{ password: hashedPassword }] });
    // mock insert refresh token
    mockDb.expects("query").once().resolves({ rows: [{ id: 1 }] });

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("auth").eql(true);
    res.body.should.have.property("msg").eql("Logged in.");
    mockDb.verify();
  });

  it("incorrect password, fail login", async () => {
    mockDb.expects("query").once().resolves({ rows: [{ password }] });

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(401);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("auth").eql(false);
    res.body.should.have.property("msg").eql("Incorrect password.");
    mockDb.verify();
  });

  it("fail login, because user doesn't exist", async () => {
    mockDb.expects("query").once().resolves({});

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(404);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("User does not exist.");
    mockDb.verify();
  });

  it("fail login, postgreSQL throws exception", async () => {
    mockDb.expects("query").once().throws(error);

    const res = await chai.request(server)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send(loginData);

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Internal server error.");
    mockDb.verify();
  });
});
