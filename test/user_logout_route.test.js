// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/user/logout", () => {
  let mockDb;

  const error = new Error("Test error");

  beforeEach(() => {
    mockDb = sandBox.mock(db);
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("fail logout, throw error", async () => {
    mockDb.expects("query").once().throws(error);

    const res = await chai.request(server)
      .post("/api/user/logout")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Internal server error.");

    sandBox.verify();
  });

  it("successfull logout", async () => {
    mockDb.expects("query").once().resolves({});

    const res = await chai.request(server)
      .post("/api/user/logout")
      .set("Cookie", "__refToken=test123");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Log out successful.");

    sandBox.verify();
  });
});
