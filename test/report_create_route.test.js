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

describe("/api/report/create", () => {
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
  const insertReportArgsMatch = sandBox.match(
    { values: [JSON.stringify(fakeArticlesInReport), userId] },
  );

  beforeEach(() => {
    mockDb = sandBox.mock(db);
    sandBox.mock(jwt).expects("verify").once().withArgs(authToken)
      .returns(fakeAuthenticatedData);
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("/report/create fail report creation db doesn't return report id", async () => {
    mockDb.expects("query").once().withArgs(insertReportArgsMatch).resolves({});

    const res = await chai.request(server)
      .post("/api/report/create")
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Creation of report failed.");
    sandBox.verify();
  });

  it("/report/create fail report creation db throw error", async () => {
    mockDb.expects("query").once().withArgs(insertReportArgsMatch).throws(error);

    const res = await chai.request(server)
      .post("/api/report/create")
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to create report.");
    sandBox.verify();
  });

  it("/report/create report successfully created", async () => {
    mockDb.expects("query").once().withArgs(insertReportArgsMatch).resolves({ rows: [{ id: 1 }] });

    const res = await chai.request(server)
      .post("/api/report/create")
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Report was successfully created.");
    sandBox.verify();
  });
});
