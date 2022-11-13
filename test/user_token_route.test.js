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
  afterEach(() => {
    sandBox.restore();
  });

  it("fail, beacause of missing token", async () => {
    const res = await chai.request(server)
      .get("/api/user/token");

    res.should.have.status(401);
  });

  it("fail, when checking refresh token", async () => {
    sandBox.mock(db).expects("query").once().resolves({ rows: [] });

    const res = await chai.request(server)
      .get("/api/user/token")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(403);

    sandBox.verify();
  });

  it("fail authentication because of fake data", async () => {
    sandBox.mock(db).expects("query").once().resolves({ rows: [{ maxage: 12000 }] });
    sandBox.mock(jwt).expects("verify").once().throws(new Error("test error"));

    const res = await chai.request(server)
      .get("/api/user/token")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(403);

    sandBox.verify();
  });

  it("successful authetication with token", async () => {
    sandBox.mock(jwt).expects("verify").once().returns({
      username: "test123",
      password: "test-password",
      id: 1,
    });
    sandBox.mock(db).expects("query").once().resolves({ rows: [{ maxage: 12000 }] });

    const res = await chai.request(server)
      .get("/api/user/token")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);

    sandBox.verify();
  });
});
