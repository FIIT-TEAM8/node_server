// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const htmlToPdf = require("html-pdf-node");
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

  const fakeArticlesInReport = [
    "6240f3e3fcf239665d512756",
    "6240f3e3fcf239665d512756",
  ];

  const fakeSearchTerms = [
    "test1",
    "test2",
  ];

  const fakeResults = {
    results: [
      {
        _id: "6240f3e3fcf239665d512756",
        html: "<h1>test1</h1>",
        keywords: ["Assassination"],
        language: "en",
        link: "https://test.com/",
        published: "2020-01-01",
        region: "gb",
        title: "Fake article number 0",
      },
      {
        _id: "6240f3e3fcf239665d512756",
        html: "<h1>test2</h1>",
        keywords: ["Assassination", "Murder"],
        language: "en",
        link: "https://test.com/",
        published: "2020-01-01",
        region: "gb",
        title: "Fake article number 1",
      },
    ],
  };

  beforeEach(() => {
    sandBox.restore();
    mockDb = sandBox.mock(db);
    mockJWT = sandBox.mock(jwt);
  });

  it("fail getting report from db", async () => {
    mockDb.expects("query").once().resolves({ rows: [] });
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);

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

  it("create report failed, db didn't return report id", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().resolves({});

    const res = await chai.request(server)
      .post("/api/report/create")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId: 1, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Creation of report failed.");
    sandBox.verify();
  });

  it("create report failed, db throw error", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().throws(error);

    const res = await chai.request(server)
      .post("/api/report/create")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId: 1, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to create report.");
    sandBox.verify();
  });

  it("report was successfully created", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().resolves({ rows: [{ id: 1 }] });

    const res = await chai.request(server)
      .post("/api/report/create")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId: 1, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Report was successfully created.");
    sandBox.verify();
  });

  it("update report failed, because db didn't return id", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().resolves({ rowCount: 0 });

    const res = await chai.request(server)
      .post("/api/report/update/1")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId: 1, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Something failed while updating report.");
    sandBox.verify();
  });

  it("update report failed, db threw error", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().throws(error);

    const res = await chai.request(server)
      .post("/api/report/update/1")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId: 1, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to update report.");
    sandBox.verify();
  });

  it("report was successfully update", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    mockDb.expects("query").once().resolves({ rowCount: 1 });

    const res = await chai.request(server)
      .post("/api/report/update/1")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ userId: 1, articlesInReport: fakeArticlesInReport }));

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Report was succesfully updated.");
    sandBox.verify();
  });

  it("download failed, because of missing arguments", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);

    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ articlesInReport: fakeArticlesInReport }));

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Wrong request, missing articles ids or search terms.");
    sandBox.verify();
  });

  it("download failed, because of missing results in data API response", async () => {
    const responseObject = {
      json: () => ({}),
    };

    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    sandBox.stub(fetch, "Promise").returns(Promise.resolve(responseObject));

    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        articlesIds: fakeArticlesInReport,
        articlesSearchTerms: fakeSearchTerms,
      }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Articles wasn't recieved from API server.");
    sandBox.verify();
  });

  it("download failed, because request on data API throws error", async () => {
    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    sandBox.stub(fetch, "Promise").throws(error);

    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        articlesIds: fakeArticlesInReport,
        articlesSearchTerms: fakeSearchTerms,
      }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to generate PDF from articles in report.");
    sandBox.verify();
  });

  it("successfully generated and downloaded PDF from articles in report", async () => {
    const responseObject = {
      json: () => (fakeResults),
    };

    mockJWT.expects("verify").once().returns(fakeAuthenticatedData);
    sandBox.stub(fetch, "Promise").resolves(responseObject);
    const htmlToPdfMock = sandBox.mock(htmlToPdf);
    htmlToPdfMock.expects("generatePdf").callsFake((file, pdfOptions) => {
      const pdfBuffer = Buffer.from(file.content);
      return new Promise((resolve, reject) => {
        resolve(pdfBuffer);
      });
    });

    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", "__authToken=test123")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        articlesIds: fakeArticlesInReport,
        articlesSearchTerms: fakeSearchTerms,
      }));

    res.should.have.status(200);
    res.should.have.header("Content-Type", "application/pdf");
    // TODO: create more assertions
    sandBox.verify();
  });
});
