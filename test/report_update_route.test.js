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

describe("/api/report/update/:id", () => {
  let mockDb;

  const userId = 1;
  const reportId = 1;
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

  const updateReportArgsMatch = sandBox.match(
    { values: [JSON.stringify(fakeArticlesInReport), reportId.toString()] },
  );

  beforeEach(() => {
    mockDb = sandBox.mock(db);
    sandBox.mock(jwt).expects("verify").once().withArgs(authToken)
      .returns(fakeAuthenticatedData);
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("update report failed, because db didn't return id", async () => {
    mockDb.expects("query").once().withArgs(updateReportArgsMatch).resolves({ rowCount: 0 });

    const res = await chai.request(server)
      .post(`/api/report/update/${reportId}`)
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ articlesInReport: fakeArticlesInReport }));

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Something failed while updating report.");
    sandBox.verify();
  });

  it("update report failed, db threw error", async () => {
    mockDb.expects("query").once().withArgs(updateReportArgsMatch).throws(error);

    const res = await chai.request(server)
      .post(`/api/report/update/${reportId}`)
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to update report.");
    sandBox.verify();
  });

  it("report was successfully update", async () => {
    mockDb.expects("query").once().withArgs(updateReportArgsMatch).resolves({ rowCount: 1 });

    const res = await chai.request(server)
      .post(`/api/report/update/${reportId}`)
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Report was succesfully updated.");
    sandBox.verify();
  });
});
