// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

const error = new Error("test error");

describe("/api/report", () => {
  let mockDb;
  let mockJWT;

  const fakeAuthenticatedData = {
    username: "test123",
    iat: "test-iat123",
    id: 1,
  };

  const fakeArticlesInReport = ["6240f3e3fcf239665d512756", "62709aceabf5bf8856f1a62f"];

  beforeEach(() => {
    sandBox.restore();
    mockDb = sandBox.mock(db);
    mockJWT = sandBox.mock(jwt);
  });

  it("fail getting report from db", async () => {
    mockDb.expects("query").once().resolves({ rows: [] });
    mockJWT.expects("verify").once().returns({
      username: "test123",
      iat: "test-iat123",
      id: 1,
    });

    const res = await chai.request(server)
      .get("/api/report/1?status=In+Progress")
      .set("Cookie", "__authToken=test123");

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to retrieve report.");
    sandBox.verify();
  });

  it("fail getting report, throw execption", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().throws(error);

    const res = await chai.request(server)
      .get("/api/report/1")
      .set("Cookie", "__authToken=test123");

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to retrieve report.");
    sandBox.verify();
  });

  it("successfully returned report data", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().resolves({
      rows: [{ id: 1, content: fakeArticlesInReport }],
    });

    const res = await chai.request(server)
      .get("/api/report/1?status=In+Progress")
      .set("Cookie", "__authToken=test123");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Report was successfully retrieved.");
    res.body.should.have.property("articlesInReport").eql(fakeArticlesInReport);
    sandBox.verify();
  });
});
