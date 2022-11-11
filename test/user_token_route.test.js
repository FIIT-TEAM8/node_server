// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("user/token", () => {
  let mockDb;

  beforeEach(() => {
    sandBox.restore();
    mockDb = sandBox.mock(db);
  });

  it("fail, beacause of missing token", async () => {
    const res = await chai.request(server)
      .get("/api/user/token");

    res.should.have.status(401);
  });

  it("fail, when checking refresh token", async () => {
    mockDb.expects("query").resolves({ rows: [] });

    const res = await chai.request(server)
      .get("/api/user/token")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(403);
    mockDb.verify();
  });

  it("fail authentication because of fake data", async () => {
    mockDb.expects("query").resolves({ rows: [{ maxage: 12000 }] });

    const res = await chai.request(server)
      .get("/api/user/token")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(403);
    mockDb.verify();
  });

  it("successful authetication with token", async () => {
    const jwtVerifyStub = sandBox.stub(jwt, "verify");
    jwtVerifyStub.returns({
      username: "test123",
      password: "test-password",
      id: 1,
    });
    mockDb.expects("query").resolves({ rows: [{ maxage: 12000 }] });
    // TODO: this is probably unnecessary
    mockDb.expects("query").resolves({
      rows: [{
        username: "test123",
        password: "pasword123",
        id: 1,
      }],
    });

    const res = await chai.request(server)
      .get("/api/user/token")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
  });
});
