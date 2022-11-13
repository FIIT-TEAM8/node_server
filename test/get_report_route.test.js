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

describe("/api/report/:user_id", () => {
  let mockDb;

  const userId = 1;
  const authToken = "a529a756858f079b7859a246d90644b5";

  const fakeAuthenticatedData = {
    username: "test123",
    iat: "test-iat123",
    id: userId,
  };

  const fakeArticlesInReport = [
    "6240f3e3fcf239665d512756",
    "6240f3e3fcf239665d512756",
  ];

  const getReportArgsMatch = sandBox.match({ values: [userId.toString(), "In Progress"] });

  beforeEach(() => {
    mockDb = sandBox.mock(db);
    sandBox.mock(jwt).expects("verify").once().withArgs(authToken)
      .returns(fakeAuthenticatedData);
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("/:user_id fail getting report from db", async () => {
    mockDb.expects("query").once().withArgs(getReportArgsMatch).resolves({ rows: [] });

    const res = await chai.request(server)
      .get(`/api/report/${userId}?status=In+Progress`)
      .set("Cookie", `__authToken=${authToken}`);

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to retrieve report.");

    sandBox.verify();
  });

  it("/:user_id fail getting report, throw execption", async () => {
    mockDb.expects("query").once().withArgs(getReportArgsMatch).throws(error);

    const res = await chai.request(server)
      .get(`/api/report/${userId}`)
      .set("Cookie", `__authToken=${authToken}`);

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to retrieve report.");
    sandBox.verify();
  });

  it("/:user_id successfully returned report data", async () => {
    mockDb.expects("query").once().withArgs(getReportArgsMatch).resolves({
      rows: [{ id: 1, content: fakeArticlesInReport }],
    });

    const res = await chai.request(server)
      .get(`/api/report/${userId}?status=In+Progress`)
      .set("Cookie", `__authToken=${authToken}`);

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Report was successfully retrieved.");
    res.body.should.have.property("articlesInReport").eql(fakeArticlesInReport);
    sandBox.verify();
  });
});
